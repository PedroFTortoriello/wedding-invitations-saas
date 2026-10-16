import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { logServerError } from "@/lib/funnel";
import { AI_ATTEMPTS_PER_DAY, AI_ATTEMPTS_PER_IP_PER_DAY } from "@/lib/platform-data";
import type { createAdminClient } from "@/lib/supabase/admin";

/**
 * IP de quem chamou. Primeiro o x-vercel-forwarded-for, que só a Vercel escreve (o
 * x-forwarded-for pode ser regravado por um proxy na frente dela); depois os genéricos.
 */
export function clientIp(hdrs: Pick<Headers, "get">): string {
  const forwarded = (hdrs.get("x-vercel-forwarded-for") ?? hdrs.get("x-forwarded-for"))?.split(",")[0]?.trim();
  return forwarded || hdrs.get("x-real-ip")?.trim() || "unknown";
}

/**
 * A "rede" que o limite conta: o IPv4 inteiro, ou o prefixo /64 do IPv6. Cada assinante de
 * operadora recebe um /64 inteiro e pode trocar de endereço dentro dele a cada pedido; contar
 * o endereço completo deixaria o limite por IP sem efeito. IPv4 mapeado (::ffff:a.b.c.d) vira IPv4.
 */
export function ipBucket(ip: string): string {
  const addr = ip.split("%")[0].toLowerCase();
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(addr);
  if (mapped) return mapped[1];
  if (!addr.includes(":")) return addr;
  const [head = "", tail = ""] = addr.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const full = [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right];
  return `${full.slice(0, 4).map((h) => h.padStart(4, "0")).join(":")}::/64`;
}

/**
 * HMAC-SHA256 da rede: conta tentativas sem guardar o endereço (LGPD, migration 0017). A
 * chave é a service role do Supabase, que só existe no servidor: sem ela não dá para testar
 * os endereços contra o hash (com ela, dá: o dado é pseudonimizado, não anônimo).
 */
export function hashIp(ip: string, key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""): string {
  return createHmac("sha256", `noivar-ai-ip:${key}`).update(ip).digest("hex").slice(0, 32);
}

export type AiClaim = "ok" | "ip" | "daily";

/**
 * Registra a tentativa de geração e diz se ela pode seguir (ai_claim_attempt, 0017).
 * Se a função ainda não existir no banco (migration não aplicada) ou o banco falhar, deixa
 * seguir e registra o erro: o limite é proteção de custo, não pode derrubar a IA.
 */
export async function claimAiAttempt(admin: ReturnType<typeof createAdminClient>, ownerId: string): Promise<AiClaim> {
  const ipHash = hashIp(ipBucket(clientIp(await headers())));
  const { data, error } = await admin.rpc("ai_claim_attempt", {
    p_ip_hash: ipHash,
    p_per_ip: AI_ATTEMPTS_PER_IP_PER_DAY,
    p_per_day: AI_ATTEMPTS_PER_DAY
  });
  if (error || (data !== "ok" && data !== "ip" && data !== "daily")) {
    await logServerError("ia.rateLimit", error ?? new Error(`resposta inesperada: ${String(data)}`), {
      userId: ownerId,
      path: "/ia"
    });
    return "ok";
  }
  return data;
}
