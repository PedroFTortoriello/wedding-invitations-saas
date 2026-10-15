import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { recordFunnelEvent, getActingContext } = vi.hoisted(() => ({ recordFunnelEvent: vi.fn(), getActingContext: vi.fn() }));
vi.mock("@/lib/funnel", () => ({ recordFunnelEvent, logServerError: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/support-session", () => ({ readSupportCookie: vi.fn() }));
vi.mock("@/lib/acting", async (importOriginal) => ({ ...(await importOriginal<object>()), getActingContext }));

import { autosaveWeddingAction } from "@/app/editor/autosave-action";
import { SUPPORT_BLOCKED_MESSAGE, type ActingContext } from "@/lib/acting";
import { rowToWeddingSite, type WeddingRow } from "@/lib/wedding";

const ADMIN = "11111111-2222-3333-4444-555555555555";
const OWNER = "66666666-7777-8888-9999-aaaaaaaaaaaa";

const row = {
  id: "w-owner",
  owner_id: OWNER,
  slug: "ana-e-bia",
  status: "draft",
  couple_names: "Ana & Bia",
  pix_key: "ana@exemplo.com",
  pix_key_type: "email",
  pix_holder_name: "Ana Souza",
  content: {}
} as unknown as WeddingRow;

/** Query builder falso: select termina em `row`, qualquer outra cadeia resolve vazia; guarda os updates. */
function fakeDb(updates: Record<string, unknown>[]) {
  const chain: Record<string, unknown> = {};
  for (const m of ["from", "select", "eq", "order", "limit", "gte", "contains"]) chain[m] = () => chain;
  chain.maybeSingle = async () => ({ data: row, error: null });
  chain.update = (payload: Record<string, unknown>) => (updates.push(payload), chain);
  chain.then = (resolve: (v: unknown) => void) => resolve({ data: [], error: null });
  return chain as unknown as ActingContext["db"];
}

function ctx(support: boolean, updates: Record<string, unknown>[]): ActingContext {
  return {
    sessionUser: { id: support ? ADMIN : OWNER } as User,
    ownerId: OWNER,
    support: support ? { adminId: ADMIN, targetUserId: OWNER, targetLabel: "Ana & Bia", expiresAt: 0 } : null,
    db: fakeDb(updates)
  };
}

const site = () => ({ ...rowToWeddingSite(row), templateId: "classico-romantico" as const });

beforeEach(() => recordFunnelEvent.mockClear());

describe("autosaveWeddingAction", () => {
  it("recusa site de outro casamento (aba aberta antes de trocar de conta) sem gravar", async () => {
    const updates: Record<string, unknown>[] = [];
    getActingContext.mockResolvedValue(ctx(true, updates));
    const res = await autosaveWeddingAction({ ...site(), id: "w-outra-conta" });
    expect(res.error).toMatch(/Recarregue/);
    expect(updates).toEqual([]);
  });

  it("modo suporte: trocar a chave Pix é bloqueado, auditado e nada é gravado", async () => {
    const updates: Record<string, unknown>[] = [];
    getActingContext.mockResolvedValue(ctx(true, updates));
    const res = await autosaveWeddingAction({ ...site(), pixKey: "golpe@exemplo.com" });
    expect(res).toEqual({ error: SUPPORT_BLOCKED_MESSAGE });
    expect(updates).toEqual([]);
    expect(recordFunnelEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "support_blocked", detail: expect.objectContaining({ action: "pix_change" }) })
    );
  });

  it("modo suporte: edita o conteúdo sem tocar nas colunas do Pix", async () => {
    const updates: Record<string, unknown>[] = [];
    getActingContext.mockResolvedValue(ctx(true, updates));
    expect(await autosaveWeddingAction({ ...site(), coupleNames: "Ana & Beatriz" })).toEqual({ ok: true });
    expect(updates).toHaveLength(1);
    expect(updates[0].couple_names).toBe("Ana & Beatriz");
    expect(Object.keys(updates[0]).filter((key) => key.startsWith("pix_"))).toEqual([]);
  });

  it("modo normal: o casal troca a própria chave Pix", async () => {
    const updates: Record<string, unknown>[] = [];
    getActingContext.mockResolvedValue(ctx(false, updates));
    expect(await autosaveWeddingAction({ ...site(), pixKey: "nova@exemplo.com" })).toEqual({ ok: true });
    expect(updates[0]).toMatchObject({ pix_key: "nova@exemplo.com", pix_key_type: "email", pix_holder_name: "Ana Souza" });
  });
});
