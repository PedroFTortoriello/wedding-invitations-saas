import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/admin/suporte-actions", () => ({ endSupportSessionAction: async () => {} }));

const { SupportBar, SupportBlockedButton, SUPPORT_BLOCKED_HINT } = await import("@/components/app/SupportBar");

const NOW = Date.UTC(2026, 8, 16, 12, 0, 0);
const support = (minutesLeft: number) => ({
  adminId: "00000000-0000-4000-8000-000000000001",
  targetUserId: "00000000-0000-4000-8000-000000000002",
  targetLabel: "Helena & Lucas",
  expiresAt: Math.floor(NOW / 1000) + minutesLeft * 60
});

describe("SupportBar", () => {
  afterEach(() => vi.useRealTimers());

  it("mostra a conta vista, o tempo restante e o botão de voltar", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const html = renderToStaticMarkup(createElement(SupportBar, { support: support(112) }));
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Modo suporte"');
    expect(html).toContain("Helena &amp; Lucas");
    expect(html).toContain("expira em ~1h 52min<");
    expect(html).toContain('aria-label="Voltar ao admin"');
  });

  it("formata horas cheias e minutos", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(renderToStaticMarkup(createElement(SupportBar, { support: support(120) }))).toContain("expira em ~2h<");
    expect(renderToStaticMarkup(createElement(SupportBar, { support: support(35) }))).toContain("expira em ~35min<");
  });

  it("ação bloqueada: focável, sem submit e com a explicação", () => {
    const html = renderToStaticMarkup(createElement(SupportBlockedButton, { className: "btn" }, "Publicar"));
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain(`title="${SUPPORT_BLOCKED_HINT}"`);
  });
});
