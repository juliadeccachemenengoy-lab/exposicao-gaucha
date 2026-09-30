import { db, json, cleanGame, cleanMode, dayInSaoPaulo, publicRow, fetchAll } from "./_shared.mjs";

export default async (request) => {
  if (request.method !== "GET") return json({ ok: false, error: "Método não permitido." }, 405);
  try {
    const url = new URL(request.url);
    const jogo = cleanGame(url.searchParams.get("jogo") || "rota");
    if (!jogo) return json({ ok: false, error: "Jogo inválido." }, 400);
    const periodo = url.searchParams.get("periodo") === "todos" ? "todos" : "hoje";
    const modo = jogo === "personalidades"
      ? cleanMode(url.searchParams.get("modo") || "fair", jogo)
      : "";
    const dia = dayInSaoPaulo();

    const rows = await fetchAll(async (from, to) => {
      let q = db()
        .from("partidas")
        .select("partida_id,jogo,jogador,modo,pontuacao,acertos,erros,duracao,sequencia,respondidas,bonus,dia_inicio,dia_finalizacao,iniciada_em,finalizada_em,versao")
        .eq("status", "concluida")
        .eq("jogo", jogo);
      if (periodo === "hoje") q = q.eq("dia_finalizacao", dia);
      if (jogo === "personalidades") q = q.eq("modo", modo);
      return q
        .order("pontuacao", { ascending: false })
        .order("acertos", { ascending: false })
        .order("erros", { ascending: true })
        .order("sequencia", { ascending: false })
        .order("duracao", { ascending: true })
        .order("finalizada_em", { ascending: true })
        .range(from, to);
    });

    return json({
      ok: true,
      jogo,
      modo,
      periodo,
      dia,
      total: rows.length,
      resultados: rows.map((r, i) => ({ ...publicRow(r), posicao: i + 1 })),
    });
  } catch (error) {
    console.error("ranking", error);
    return json({ ok: false, error: "Não foi possível carregar o ranking." }, 500);
  }
};
