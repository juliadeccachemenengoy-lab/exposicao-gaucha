import { db, json, dayInSaoPaulo, gameLabel, fetchAll } from "./_shared.mjs";

const GAMES = ["personalidades", "rota", "bah-ou-nao-bah"];
const norm = (v) => String(v || "").trim().toLocaleLowerCase("pt-BR");

async function rowsForGame(game, period, day) {
  return fetchAll(async (from, to) => {
    let q = db()
      .from("partidas")
      .select("jogador,pontuacao,status,dia_inicio,dia_finalizacao")
      .eq("jogo", game);
    if (period === "hoje") q = q.eq("dia_inicio", day);
    return q.range(from, to);
  });
}

export default async (request) => {
  if (request.method !== "GET") return json({ ok: false, error: "Método não permitido." }, 405);
  try {
    const url = new URL(request.url);
    const periodo = url.searchParams.get("periodo") === "todos" ? "todos" : "hoje";
    const dia = dayInSaoPaulo();
    const stats = {};
    const allPlayers = new Set();
    let totalIniciadas = 0;
    let totalConcluidas = 0;

    for (const jogo of GAMES) {
      const rows = await rowsForGame(jogo, periodo, dia);
      const starts = rows;
      const results = rows.filter((r) => r.status === "concluida");

      const players = new Set(results.map((r) => norm(r.jogador)).filter(Boolean));
      players.forEach((p) => allPlayers.add(p));
      const scoreSum = results.reduce((a, r) => a + Number(r.pontuacao || 0), 0);
      const highest = results.reduce((m, r) => Math.max(m, Number(r.pontuacao || 0)), 0);

      totalIniciadas += starts.length;
      totalConcluidas += results.length;
      stats[jogo] = {
        jogo,
        nome: gameLabel(jogo),
        iniciadas: starts.length,
        concluidas: results.length,
        participantes: players.size,
        mediaPontuacao: results.length ? Math.round(scoreSum / results.length) : 0,
        maiorPontuacao: highest,
        taxaConclusao: starts.length ? Math.round((results.length / starts.length) * 100) : 0,
      };
    }

    return json({
      ok: true,
      periodo,
      dia,
      total: {
        iniciadas: totalIniciadas,
        concluidas: totalConcluidas,
        participantes: allPlayers.size,
        taxaConclusao: totalIniciadas ? Math.round((totalConcluidas / totalIniciadas) * 100) : 0,
      },
      jogos: stats,
    });
  } catch (error) {
    console.error("estatisticas", error);
    return json({ ok: false, error: "Não foi possível carregar as estatísticas." }, 500);
  }
};
