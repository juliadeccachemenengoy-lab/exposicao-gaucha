import { createClient } from "@supabase/supabase-js";

export const TIME_ZONE = "America/Sao_Paulo";
export const VALID_GAMES = new Set(["personalidades", "rota", "bah-ou-nao-bah"]);

let cachedClient = null;

export function db() {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Netlify.");
  }
  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "x-application-name": "expedicao-gaucha-netlify" } },
  });
  return cachedClient;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export function cleanText(value, max = 48) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function cleanGame(value) {
  const game = cleanText(value, 32).toLowerCase();
  return VALID_GAMES.has(game) ? game : "";
}

export function cleanMode(value, game) {
  if (game !== "personalidades") return "";
  const mode = cleanText(value, 12).toLowerCase();
  return mode === "fair" || mode === "total" ? mode : "fair";
}

export function number(value, min = 0, max = 100000) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function integer(value, min = 0, max = 100000) {
  return Math.round(number(value, min, max));
}

export function dayInSaoPaulo(timestamp = Date.now()) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(safeDate);
  const obj = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
}

export function safeIso(value) {
  const d = new Date(value || "");
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function safeId(value) {
  const id = cleanText(value, 80).replace(/[^a-zA-Z0-9_-]/g, "");
  if (id.length >= 8) return id;
  return crypto.randomUUID();
}

export function maxScore(game, mode = "") {
  if (game === "rota") return 1000;
  if (game === "personalidades") return mode === "total" ? 13000 : 4000;
  return 100000;
}

export function validateCommon(body) {
  const jogo = cleanGame(body?.jogo);
  const jogador = cleanText(body?.jogador, 32);
  const modo = cleanMode(body?.modo, jogo);
  if (!jogo) return { error: "Jogo inválido." };
  if (!jogador) return { error: "Informe o nome ou apelido do jogador." };
  return { jogo, jogador, modo, partidaId: safeId(body?.partidaId) };
}

export function gameLabel(game) {
  return ({
    personalidades: "Descubra o Sul-Rio-Grandense",
    rota: "Rota pelo Rio Grande do Sul",
    "bah-ou-nao-bah": "Bah ou Não Bah?",
  })[game] || game;
}

export function publicRow(row) {
  return {
    partidaId: row.partida_id,
    jogo: row.jogo,
    jogador: row.jogador,
    modo: row.modo || "",
    dia: row.dia_finalizacao || row.dia_inicio,
    pontuacao: Number(row.pontuacao || 0),
    acertos: Number(row.acertos || 0),
    erros: Number(row.erros || 0),
    duracao: Number(row.duracao || 0),
    sequencia: Number(row.sequencia || 0),
    respondidas: Number(row.respondidas || 0),
    bonus: Number(row.bonus || 0),
    iniciadaEm: row.iniciada_em,
    finalizadaEm: row.finalizada_em,
    versao: row.versao || "",
  };
}

export async function fetchAll(queryFactory, pageSize = 1000) {
  const all = [];
  let from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await queryFactory(from, to);
    if (error) throw error;
    const chunk = data || [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
    if (from > 50000) break; // proteção contra respostas gigantes acidentais
  }
  return all;
}
