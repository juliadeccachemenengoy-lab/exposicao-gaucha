(() => {
  const btn = document.getElementById('fullscreenBtn');
  if (btn) {
    btn.addEventListener('click', async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen?.();
          btn.textContent = '×';
          btn.title = 'Sair da tela cheia';
        } else {
          await document.exitFullscreen?.();
        }
      } catch (_) {}
    });
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        btn.textContent = '⛶';
        btn.title = 'Tela cheia';
      }
    });
  }
})();


(async () => {
  const badge = document.getElementById('todayPlayedBadge');
  if (!badge) return;
  try {
    const res = await fetch('/api/estatisticas?periodo=hoje', {cache:'no-store'});
    const data = await res.json();
    if (res.ok && data.ok) badge.innerHTML = `<b>${Number(data.total.concluidas||0).toLocaleString('pt-BR')}</b> partidas hoje`;
  } catch (_) { badge.innerHTML = '<b>—</b> partidas hoje'; }
})();
