import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { recordFunnelEvent } = vi.hoisted(() => ({ recordFunnelEvent: vi.fn() }));
vi.mock("@/lib/funnel", () => ({ recordFunnelEvent }));
const { requireUser, createClient, createAdminClient, readSupportCookie } = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  readSupportCookie: vi.fn()
}));
vi.mock("@/lib/auth", () => ({ requireUser }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/lib/support-session", () => ({ readSupportCookie }));

import { getActingContext, guardSupportWrite, SUPPORT_BLOCKED_MESSAGE, type ActingContext } from "@/lib/acting";

const ADMIN = "11111111-2222-3333-4444-555555555555";
const OWNER = "66666666-7777-8888-9999-aaaaaaaaaaaa";

/** Query builder falso: qualquer encadeamento termina em `result` (ou lança). */
function fakeDb(result: { data: unknown } | Error) {
  const chain: Record<string, unknown> = {};
  for (const method of ["from", "select", "eq", "gte", "contains"]) chain[method] = () => chain;
  chain.limit = async () => {
    if (result instanceof Error) throw result;
    return result;
  };
  return chain as unknown as ActingContext["db"];
}

function ctx(support: boolean, db = fakeDb({ data: [] })): ActingContext {
  return {
    sessionUser: { id: support ? ADMIN : OWNER } as User,
    ownerId: OWNER,
    support: support ? { adminId: ADMIN, targetUserId: OWNER, targetLabel: "Ana & Bia", expiresAt: 0 } : null,
    db
  };
}

beforeEach(() => recordFunnelEvent.mockClear());

describe("guardSupportWrite", () => {
  it("modo normal: sempre libera e não registra nada", async () => {
    expect(await guardSupportWrite(ctx(false), "publish", "w1")).toEqual({ ok: true });
    expect(await guardSupportWrite(ctx(false), "autosave", "w1")).toEqual({ ok: true });
    expect(recordFunnelEvent).not.toHaveBeenCalled();
  });

  it("suporte + bloqueada: recusa com a mensagem e registra support_blocked", async () => {
    expect(await guardSupportWrite(ctx(true), "publish_checkout", "w1")).toEqual({ ok: false, message: SUPPORT_BLOCKED_MESSAGE });
    expect(recordFunnelEvent).toHaveBeenCalledWith({
      event: "support_blocked",
      userId: OWNER,
      weddingId: "w1",
      detail: { adminId: ADMIN, targetUserId: OWNER, action: "publish_checkout" }
    });
  });

  it("suporte + permitida sem registro recente: libera e registra support_action", async () => {
    expect(await guardSupportWrite(ctx(true), "autosave", "w1")).toEqual({ ok: true });
    expect(recordFunnelEvent).toHaveBeenCalledWith({
      event: "support_action",
      userId: OWNER,
      weddingId: "w1",
      detail: { adminId: ADMIN, targetUserId: OWNER, action: "autosave" }
    });
  });

  it("suporte + permitida com registro nos últimos 15 min: libera sem registrar de novo", async () => {
    expect(await guardSupportWrite(ctx(true, fakeDb({ data: [{ id: "e1" }] })), "gifts_toggle")).toEqual({ ok: true });
    expect(recordFunnelEvent).not.toHaveBeenCalled();
  });

  it("suporte + permitida com falha na consulta: libera e registra mesmo assim", async () => {
    expect(await guardSupportWrite(ctx(true, fakeDb(new Error("boom"))), "guests_add", null)).toEqual({ ok: true });
    expect(recordFunnelEvent).toHaveBeenCalledTimes(1);
  });
});

describe("getActingContext", () => {
  const TARGET = OWNER;
  const sessionDb = { tag: "session" };
  type Profile = { id: string; role: string; name: string | null; email: string | null } | null;

  /** Service role falso: profiles por id; weddings devolve o nome do casal. */
  function adminDb(profiles: Record<string, Profile>) {
    return {
      from(table: string) {
        let id = "";
        const chain = {
          select: () => chain,
          order: () => chain,
          limit: () => chain,
          eq: (_col: string, value: string) => ((id = value), chain),
          maybeSingle: async () => ({ data: table === "profiles" ? (profiles[id] ?? null) : { couple_names: "Ana & Bia" } })
        };
        return chain;
      }
    };
  }

  function setup({ cookie, me = "admin", target = "client" }: { cookie: unknown; me?: string; target?: string | null }) {
    requireUser.mockResolvedValue({ id: ADMIN });
    createClient.mockResolvedValue(sessionDb);
    readSupportCookie.mockResolvedValue(cookie);
    createAdminClient.mockReturnValue(
      adminDb({
        [ADMIN]: { id: ADMIN, role: me, name: "Admin", email: null },
        [TARGET]: target ? { id: TARGET, role: target, name: null, email: "casal@exemplo.com" } : null
      })
    );
  }

  const valid = { adminId: ADMIN, targetUserId: TARGET, exp: 9_999_999_999 };

  it.each([
    ["sem cookie", { cookie: null }],
    ["cookie de outro admin", { cookie: { ...valid, adminId: "99999999-2222-3333-4444-555555555555" } }],
    ["admin rebaixado", { cookie: valid, me: "client" }],
    ["alvo não existe", { cookie: valid, target: null }],
    ["alvo virou admin", { cookie: valid, target: "admin" }]
  ])("%s: modo normal com a sessão (RLS)", async (_name, options) => {
    setup(options);
    const result = await getActingContext();
    expect(result.support).toBeNull();
    expect(result.ownerId).toBe(ADMIN);
    expect(result.db).toBe(sessionDb);
  });

  it("cookie válido de admin para cliente: dono = cliente, service role e rótulo do casal", async () => {
    setup({ cookie: valid });
    const result = await getActingContext();
    expect(result.ownerId).toBe(TARGET);
    expect(result.db).not.toBe(sessionDb);
    expect(result.support).toEqual({ adminId: ADMIN, targetUserId: TARGET, targetLabel: "Ana & Bia", expiresAt: valid.exp });
  });
});
