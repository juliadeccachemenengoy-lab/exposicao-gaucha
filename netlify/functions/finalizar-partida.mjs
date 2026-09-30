import {
  db, json, validateCommon, dayInSaoPaulo, integer, number,
  maxScore, cleanText, safeIso,
} from "./_shared.mjs";

export default async (request) => {
  if (request.method !== "POST") return json({ ok: false, error: "Método não permitido." }, 405);
  try {
    const body = await request.json();
    const common = validateCommon(body);
    if (common.error) return json({ ok: false, error: common.error }, 400);

    const nowIso = new Date().toISOString();
    const clientStart = safeIso(body?.iniciadaEmCliente);
    const finalData = {
      jogo: common.jogo,
      jogador: common.jogador,
      modo: common.modo,
      status: "concluida",
      dia_finalizacao: dayInSaoPaulo(nowIso),
      finalizada_em: nowIso,
      pontuacao: integer(body?.pontuacao, 0, maxScore(common.jogo, common.modo)),
      acertos: integer(body?.acertos, 0, 1000),
      erros: integer(body?.erros, 0, 1000),
      duracao: Number(number(body?.duracao, 0, 7200).toFixed(2)),
      sequencia: integer(body?.sequencia, 0, 1000),
      respondidas: integer(body?.respondidas, 0, 1000),
      bonus: integer(body?.bonus, 0, 100000),
      versao: cleanText(body?.versao, 24),
    };

    // Primeiro tenta concluir a partida já criada. Assim preservamos o horário real do início.
    const { data: updated, error: updateError } = await db()
      .from("partidas")
      .update(finalData)
      .eq("partida_id", common.partidaId)
      .select("partida_id")
      .maybeSingle();
    if (updateError) throw updateError;

    // Se o registro de início nunca chegou, cria a partida completa agora.
    if (!updated) {
      const startedAt = clientStart || nowIso;
      const fallback = {
        partida_id: common.partidaId,
        jogo: common.jogo,
        jogador: common.jogador,
        modo: common.modo,
        status: "concluida",
        dia_inicio: dayInSaoPaulo(startedAt),
        iniciada_em: startedAt,
        iniciada_em_cliente: clientStart || null,
        ...finalData,
      };
      const { error: insertError } = await db()
        .from("partidas")
        .upsert(fallback, { onConflict: "partida_id" });
      if (insertError) throw insertError;
    }

    return json({ ok: true, partidaId: common.partidaId, dia: finalData.dia_finalizacao });
  } catch (error) {
    console.error("finalizar-partida", error);
    return json({ ok: false, error: "Não foi possível registrar o resultado." }, 500);
  }
};
