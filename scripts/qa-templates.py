"""QA mecânico dos modelos de convite (complementa a revisão visual).

Uso (servidor no ar; Playwright para Python com chromium):
    python scripts/qa-templates.py <base-url> <id|all> [pasta-de-saida]

Para cada modelo, nos slugs helena-e-lucas / site-novo / nomes-longos e nas larguras
360, 390, 768 e 1440, abre /modelo/<id>/<slug> e confere:
  - rolagem horizontal (scrollWidth > largura da janela)
  - erros de console e requisições 4xx/5xx do próprio site (fotos remotas fora)
  - texto cortado: elementos com texto cujo scrollWidth passa do clientWidth com overflow escondido
  - imagens <img> sem alt
  - botões com menos de 40px e links com menos de 24px de altura (WCAG 2.5.8)
  - no site-novo: seções que não deviam existir (presentes sem cota, galeria sem foto;
    a programação inicial tem 3 horários, então ela pode aparecer) e textos "undefined"/"null"/"NaN"
  - nos três slugs: nomes do casal presentes no HTML
E no código-fonte do modelo:
  - dados fixos do casal de exemplo (Helena, Lucas, Três Ipês, Itu, 5 de dezembro)
  - classes Tailwind no TSX (o modelo só usa o próprio CSS module)
  - variáveis obrigatórias dos widgets no CSS (--g-* e --gf-*)
  - --demo-bar-h no CSS (capa desconta a barra da demo)
  - prefers-reduced-motion no CSS quando há animation/transition contínua
Saída: <pasta>/<id>.json e um resumo <pasta>/RESUMO.md (pasta padrão ./.qa).
"""

import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SLUGS = ["helena-e-lucas", "site-novo", "nomes-longos"]
WIDTHS = [360, 390, 768, 1440]
REQUIRED_VARS = [
    "--g-card", "--g-dialog-bg", "--g-border", "--g-ink", "--g-muted", "--g-accent", "--g-on-accent", "--g-price",
    "--g-radius", "--g-img-radius", "--g-img-filter", "--g-scrim", "--g-error",
    "--gf-bg", "--gf-card", "--gf-ink", "--gf-muted", "--gf-border", "--gf-field", "--gf-accent", "--gf-on-accent",
    "--gf-radius", "--gf-eyebrow", "--gf-error", "--font-serif", "--font-sans"
]
HARDCODED = ["Helena", "Lucas", "Três Ipês", "Tres Ipes", "Itu, SP", "5 de dezembro", "16:30", "Ribeiro", "Moreira"]
TAILWIND = re.compile(r'className="[^"{]*\b(flex|grid|mt-\d|px-\d|py-\d|text-(sm|lg|xl|ink|forest)|bg-(bg|forest|ink)|rounded-(lg|xl|full)|font-(serif|sans|semibold|bold)|items-center|justify-)\b')

PAGE_CHECKS = """() => {
  const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, scrollWidth: document.documentElement.scrollWidth, cut: [], noAlt: [], smallTargets: [], badText: [], sections: {} };
  const main = document.querySelector('main') || document.body;
  for (const el of main.querySelectorAll('h1,h2,h3,h4,p,span,a,li,time,dt,dd,figcaption,blockquote,button')) {
    if (!el.textContent || !el.textContent.trim()) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const hiddenX = cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.textOverflow === 'ellipsis';
    if (hiddenX && el.scrollWidth > el.clientWidth + 2 && cs.whiteSpace !== 'nowrap') {
      out.cut.push({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), text: el.textContent.trim().slice(0, 60), sw: el.scrollWidth, cw: el.clientWidth });
    }
    if (el.scrollWidth > window.innerWidth + 2 && el.getBoundingClientRect().left < window.innerWidth) {
      out.cut.push({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), text: el.textContent.trim().slice(0, 60), sw: el.scrollWidth, cw: window.innerWidth, viewport: true });
    }
  }
  for (const img of main.querySelectorAll('img')) {
    if (!img.hasAttribute('alt')) out.noAlt.push((img.getAttribute('src') || '').slice(0, 80));
  }
  for (const el of main.querySelectorAll('button, a[class]')) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width === 0 || r.height === 0 || cs.display === 'none') continue;
    const inlineText = cs.display === 'inline' && el.tagName === 'A';
    const min = el.tagName === 'BUTTON' ? 40 : 24; // WCAG 2.5.8: links de texto 24px; botões de ação 40px
    if (!inlineText && r.height < min) out.smallTargets.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40), h: Math.round(r.height) });
  }
  const text = main.innerText || '';
  for (const bad of ['undefined', 'null', 'NaN', '[object Object]']) if (text.includes(bad)) out.badText.push(bad);
  for (const id of ['presentes', 'programa', 'programacao', 'detalhes', 'local', 'galeria', 'confirmar', 'rsvp', 'historia', 'convite', 'informacoes', 'recados']) {
    const el = document.getElementById(id);
    out.sections[id] = el ? (el.innerText || '').trim().length : null;
  }
  out.hasNames = (document.body.innerText || '').toLowerCase().includes(String(window.__names || '').toLowerCase()); // innerText aplica text-transform
  return out;
}"""

NAMES = {"helena-e-lucas": "Helena", "site-novo": "Ana", "nomes-longos": "Maria Fernanda"}


def template_ids() -> list[str]:
    source = (ROOT / "src" / "lib" / "templates" / "catalog.ts").read_text(encoding="utf-8")
    return re.findall(r'^\s+id: "([a-z0-9-]+)",$', source, re.M)


def source_checks(tid: str) -> dict:
    folder = ROOT / "src" / "components" / "templates" / tid
    tsx = "\n".join(p.read_text(encoding="utf-8") for p in folder.glob("*.tsx"))
    css = "\n".join(p.read_text(encoding="utf-8") for p in folder.glob("*.css"))
    hard = [h for h in HARDCODED if h in tsx]
    tailwind = len(TAILWIND.findall(tsx))
    missing_vars = [v for v in REQUIRED_VARS if f"{v}:" not in css]
    animated = bool(re.search(r"animation:|animation-name:|@keyframes", css))
    return {
        "hardcoded": hard,
        "tailwindClasses": tailwind,
        "missingWidgetVars": missing_vars,
        "demoBarVar": "--demo-bar-h" in css,
        "reducedMotion": ("prefers-reduced-motion" in css) if animated else True,
        "usesInheritWidgets": ('variant="inherit"' in tsx),
        "tsxLines": tsx.count("\n"),
        "cssLines": css.count("\n"),
    }


def run(base: str, ids: list[str], out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    summary = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for tid in ids:
            report = {"id": tid, "source": source_checks(tid), "pages": []}
            for slug in SLUGS:
                for width in WIDTHS:
                    context = browser.new_context(viewport={"width": width, "height": 900}, locale="pt-BR", reduced_motion="reduce")
                    context.route("**/*", lambda route: route.continue_() if route.request.method == "GET" else route.abort())
                    page = context.new_page()
                    errors, failed = [], []
                    page.on("console", lambda m: errors.append(m.text[:200]) if m.type == "error" else None)
                    page.on("response", lambda r: failed.append(f"{r.status} {r.url[:100]}") if r.status >= 400 and base in r.url and "/_next/" not in r.url else None)
                    url = f"{base}/modelo/{tid}/{slug}"
                    try:
                        page.goto(url, wait_until="networkidle", timeout=120000)
                        page.evaluate(f"window.__names = {json.dumps(NAMES[slug])}")
                        page.wait_for_timeout(400)
                        result = page.evaluate(PAGE_CHECKS)
                    except Exception as exc:  # noqa: BLE001
                        result = {"error": str(exc)[:200]}
                    result.update({"slug": slug, "width": width, "consoleErrors": errors[:5], "failedRequests": failed[:5]})
                    report["pages"].append(result)
                    context.close()
            (out / f"{tid}.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
            summary.append(summarize(report))
            print(summary[-1].split("\n")[0])
        browser.close()
    (out / "RESUMO.md").write_text("\n\n".join(summary), encoding="utf-8")


def summarize(report: dict) -> str:
    tid = report["id"]
    src = report["source"]
    problems = []
    if src["hardcoded"]:
        problems.append(f"dados fixos no TSX: {', '.join(src['hardcoded'])}")
    if src["tailwindClasses"]:
        problems.append(f"{src['tailwindClasses']} className com cara de Tailwind")
    if src["missingWidgetVars"]:
        problems.append(f"vars dos widgets faltando: {', '.join(src['missingWidgetVars'])}")
    if not src["demoBarVar"]:
        problems.append("sem --demo-bar-h na capa")
    if not src["reducedMotion"]:
        problems.append("animação sem prefers-reduced-motion")
    if not src["usesInheritWidgets"]:
        problems.append('widgets sem variant="inherit"')
    for pg in report["pages"]:
        tag = f"{pg['slug']}@{pg['width']}"
        if "error" in pg:
            problems.append(f"{tag}: falha ao abrir ({pg['error']})")
            continue
        if pg.get("overflowX"):
            problems.append(f"{tag}: rolagem horizontal ({pg['scrollWidth']}px)")
        for cut in pg.get("cut", [])[:3]:
            problems.append(f"{tag}: texto cortado <{cut['tag']}> “{cut['text']}” ({cut['sw']}>{cut['cw']})")
        if pg.get("noAlt"):
            problems.append(f"{tag}: {len(pg['noAlt'])} img sem alt")
        for t in pg.get("smallTargets", [])[:3]:
            problems.append(f"{tag}: alvo pequeno <{t['tag']}> “{t['text']}” {t['h']}px")
        if pg.get("badText"):
            problems.append(f"{tag}: texto {pg['badText']}")
        if not pg.get("hasNames"):
            problems.append(f"{tag}: nomes do casal não encontrados")
        if pg["slug"] == "site-novo":
            s = pg.get("sections", {})
            if s.get("presentes"):
                problems.append(f"{tag}: seção #presentes aparece sem cotas")
            if s.get("galeria"):
                problems.append(f"{tag}: seção #galeria aparece sem fotos")
        if pg.get("consoleErrors"):
            problems.append(f"{tag}: console: {pg['consoleErrors'][0][:120]}")
        if pg.get("failedRequests"):
            problems.append(f"{tag}: requisição falhou: {pg['failedRequests'][0]}")
    # dedup keeping order
    seen, unique = set(), []
    for item in problems:
        if item not in seen:
            seen.add(item)
            unique.append(item)
    head = f"## {tid} — {len(unique)} apontamento(s) · TSX {src['tsxLines']} linhas · CSS {src['cssLines']} linhas"
    return head + ("\n" + "\n".join(f"- {u}" for u in unique) if unique else "\n- ok")


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    base, which = sys.argv[1].rstrip("/"), sys.argv[2]
    ids = template_ids() if which == "all" else [which]
    out = Path(sys.argv[3]) if len(sys.argv) > 3 else ROOT / ".qa"
    run(base, ids, out)


if __name__ == "__main__":
    main()
