import { db, json, validateCommon, dayInSaoPaulo, cleanText, safeIso } from "./_shared.mjs";

export default async (request) => {
  if (request.method !== "POST") return json({ ok: false, error: "Método não permitido." }, 405);
  try {
    const body = await request.json();
    const common = validateCommon(body);
    if (common.error) return json({ ok: false, error: common.error }, 400);

    const clientIso = safeIso(body?.iniciadaEmCliente);
    const startedAt = clientIso || new Date().toISOString();
    const registro = {
      partida_id: common.partidaId,
      jogo: common.jogo,
      jogador: common.jogador,
      modo: common.modo,
      status: "iniciada",
      dia_inicio: dayInSaoPaulo(startedAt),
      iniciada_em: startedAt,
      iniciada_em_cliente: clientIso || null,
      versao: cleanText(body?.versao, 24),
    };

    const { data, error } = await db()
      .from("partidas")
      .upsert(registro, { onConflict: "partida_id", ignoreDuplicates: true })
      .select("partida_id,status,dia_inicio")
      .maybeSingle();

    if (error) throw error;
    return json({
      ok: true,
      partidaId: common.partidaId,
      dia: data?.dia_inicio || registro.dia_inicio,
      novo: Boolean(data),
    });
  } catch (error) {
    console.error("iniciar-partida", error);
    return json({ ok: false, error: "Não foi possível registrar o início da partida." }, 500);
  }
};
