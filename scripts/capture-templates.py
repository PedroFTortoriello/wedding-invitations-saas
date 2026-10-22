"""Capturas dos modelos de convite: QA (PNG de página inteira) e prévias da vitrine (webp).

Uso (fora do npm; requer Playwright para Python com chromium e Pillow; o servidor no ar):
    python scripts/capture-templates.py shots  <base-url> <id|all> [slug]  [pasta-de-saida]
    python scripts/capture-templates.py assets <base-url> <id|all>

shots   PNGs de página inteira em 390px (@2x) e 1440px, para olhar o modelo:
        <pasta>/<id>--<slug>--mobile.png e --desktop.png (pasta padrão: ./.shots).
        slug: helena-e-lucas (padrão), site-novo (sem fotos, textos iniciais) ou
        nomes-longos (nomes compostos e textos longos). Ver lib/demo-wedding DEMO_SLUGS.
assets  prévias da vitrine e do seletor (sobrescreve):
        public/assets/templates/<id>-phone.webp    primeira tela a 390x844 @2x, reduzida p/ 520px de largura, <= 70 KB
        public/assets/templates/<id>-desktop.webp  primeira tela a 1440x900, reduzida p/ 1200px, <= 160 KB
        public/assets/templates/<id>-full.webp     página inteira a 390px, reduzida p/ 360px, <= 320 KB

Segurança: toda requisição que não for GET é abortada (nada de RSVP, recado ou Pix) e o
consentimento de cookies vai como "denied". A barra da demo é escondida nas capturas.
"""

import io
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets" / "templates"
MOBILE = (390, 844)
DESKTOP = (1440, 900)
# Some a barra da demo e zera o respiro dela: a captura mostra o site como o casal publica.
HIDE_DEMO_BAR = "[data-demo-bar]{display:none !important} [class*='--demo-bar-h']{--demo-bar-h:0px !important}"


def template_ids() -> list[str]:
    """Ids do catálogo (lib/templates/catalog.ts), sem avaliar TypeScript."""
    source = (ROOT / "src" / "lib" / "templates" / "catalog.ts").read_text(encoding="utf-8")
    import re

    return re.findall(r'^\s+id: "([a-z0-9-]+)",$', source, re.M)


def settle(page: Page) -> None:
    """Rola a página inteira (as fotos lazy só carregam ao entrar na tela), espera fontes e
    rede, marca tudo como revelado (sem animação pendente) e volta ao topo."""
    page.wait_for_load_state("networkidle")
    page.evaluate(
        """async () => {
          const step = Math.max(400, window.innerHeight * 0.8);
          for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 90));
          }
          window.scrollTo(0, document.documentElement.scrollHeight);
          await new Promise((r) => setTimeout(r, 300));
          await Promise.all(Array.from(document.images).filter((img) => !img.complete).map((img) => new Promise((r) => { img.onload = img.onerror = r; })));
          await document.fonts.ready;
          document.querySelectorAll('[data-reveal]').forEach((el) => el.setAttribute('data-shown', 'true'));
          document.documentElement.classList.remove('js');
          window.scrollTo(0, 0);
        }"""
    )
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)


def open_page(context, url: str, size: tuple[int, int], scale: float) -> Page:
    page = context.new_page()
    page.set_viewport_size({"width": size[0], "height": size[1]})
    page.goto(url, wait_until="domcontentloaded")
    page.add_style_tag(content=HIDE_DEMO_BAR)
    settle(page)
    return page


def webp(png: bytes, width: int, max_kb: int, path: Path) -> None:
    img = Image.open(io.BytesIO(png)).convert("RGB")
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    for quality in (82, 74, 66, 58, 50, 42):
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=quality, method=6)
        if buf.tell() <= max_kb * 1024:
            break
    path.write_bytes(buf.getvalue())
    print(f"{path.relative_to(ROOT)}  {buf.tell() // 1024} KB")


def shots(base: str, ids: list[str], slug: str, out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for tid in ids:
            url = f"{base}/modelo/{tid}/{slug}"
            for label, size, scale in (("mobile", MOBILE, 2), ("desktop", DESKTOP, 1)):
                context = browser.new_context(device_scale_factor=scale, locale="pt-BR", reduced_motion="reduce")
                context.route("**/*", lambda route: route.continue_() if route.request.method == "GET" else route.abort())
                context.add_cookies([{"name": "noivar_consent", "value": "denied", "url": base}])
                page = open_page(context, url, size, scale)
                target = out / f"{tid}--{slug}--{label}.png"
                page.screenshot(path=str(target), full_page=True)
                print(target)
                context.close()
        browser.close()


def assets(base: str, ids: list[str]) -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for tid in ids:
            url = f"{base}/modelo/{tid}/helena-e-lucas"
            context = browser.new_context(device_scale_factor=2, locale="pt-BR", reduced_motion="reduce")
            context.route("**/*", lambda route: route.continue_() if route.request.method == "GET" else route.abort())
            page = open_page(context, url, MOBILE, 2)
            webp(page.screenshot(), 520, 70, ASSETS / f"{tid}-phone.webp")
            webp(page.screenshot(full_page=True), 360, 320, ASSETS / f"{tid}-full.webp")
            context.close()
            context = browser.new_context(device_scale_factor=1, locale="pt-BR", reduced_motion="reduce")
            context.route("**/*", lambda route: route.continue_() if route.request.method == "GET" else route.abort())
            page = open_page(context, url, DESKTOP, 1)
            webp(page.screenshot(), 1200, 160, ASSETS / f"{tid}-desktop.webp")
            context.close()
        browser.close()


def main() -> None:
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    mode, base, which = sys.argv[1], sys.argv[2].rstrip("/"), sys.argv[3]
    ids = template_ids() if which == "all" else [which]
    if mode == "shots":
        slug = sys.argv[4] if len(sys.argv) > 4 else "helena-e-lucas"
        out = Path(sys.argv[5]) if len(sys.argv) > 5 else ROOT / ".shots"
        shots(base, ids, slug, out)
    elif mode == "assets":
        assets(base, ids)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
