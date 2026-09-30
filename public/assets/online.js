(() => {
  const QUEUE_KEY = 'expedicaoGauchaFilaOnlineV1';
  const VERSION = 'portal-1.0';
  let flushing = false;

  const uuid = () => {
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (_) {}
    return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  };

  const loadQueue = () => {
    try { const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); return Array.isArray(q) ? q : []; }
    catch (_) { return []; }
  };
  const saveQueue = (q) => { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-250))); } catch (_) {} };
  const enqueue = (item) => {
    const q = loadQueue();
    if (!q.some(x => x.key === item.key)) q.push(item);
    saveQueue(q);
  };

  async function post(url, payload) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function flush() {
    if (flushing || !navigator.onLine) return;
    flushing = true;
    try {
      let q = loadQueue();
      const pending = [];
      for (const item of q) {
        try { await post(item.url, item.payload); }
        catch (_) { pending.push(item); }
      }
      saveQueue(pending);
    } finally { flushing = false; }
  }

  function startGame({game, player, mode=''}) {
    const session = {
      partidaId: uuid(),
      jogo: game,
      jogador: String(player || '').trim().slice(0, 32),
      modo: mode || '',
      iniciadaEmCliente: new Date().toISOString(),
      versao: VERSION,
    };
    const item = {key:`start:${session.partidaId}`, url:'/api/iniciar-partida', payload:session};
    enqueue(item); flush();
    return session;
  }

  function finishGame(session, result={}) {
    if (!session?.partidaId) return;
    const payload = {
      ...session,
      pontuacao: Number(result.score ?? result.pontuacao ?? 0),
      acertos: Number(result.correct ?? result.acertos ?? 0),
      erros: Number(result.wrong ?? result.erros ?? 0),
      duracao: Number(result.duration ?? result.duracao ?? 0),
      sequencia: Number(result.bestStreak ?? result.sequencia ?? 0),
      respondidas: Number(result.answered ?? result.respondidas ?? 0),
      bonus: Number(result.bonus ?? 0),
      versao: VERSION,
    };
    const item = {key:`finish:${session.partidaId}`, url:'/api/finalizar-partida', payload};
    enqueue(item); flush();
  }

  window.ExpedicaoOnline = { startGame, finishGame, flush, pending: () => loadQueue().length };
  window.addEventListener('online', flush);
  setTimeout(flush, 400);
  setInterval(flush, 15000);
})();
