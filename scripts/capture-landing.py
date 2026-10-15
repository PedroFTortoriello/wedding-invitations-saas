"""Capturas da landing: telas reais dos modelos, recortes das seções, imagem OG e ícones.

Uso (fora do npm):
    python scripts/capture-landing.py http://localhost:3000
    python scripts/capture-landing.py https://<preview>.vercel.app
    python scripts/capture-landing.py http://localhost:3000 tour   # só as páginas inteiras dos mockups
    python scripts/capture-landing.py http://localhost:3000 capa   # só as telas do hero da landing

Requisitos: Python 3.10+, Playwright para Python (pip install playwright &&
playwright install chromium) e Pillow. O servidor (dev ou produção) precisa estar no ar
na URL passada; prefira um build de produção (sem o indicador de dev do Next).

O que gera (sobrescreve):
    public/assets/landing/modelos/<id>-mobile.webp   390x844 @2x, recorte 780x1300 com os nomes na metade de cima, <= 70 KB
    public/assets/landing/modelos/<id>-desktop-full.webp  página inteira a 1440px reduzida p/ 1000px de largura, <= 420 KB
    public/assets/landing/modelos/<id>-mobile-full.webp   página inteira a 390px @1x, <= 360 KB
                                                     (as duas rolam dentro do MacBook e do iPhone da seção Modelos)
    public/assets/landing/presentes-pix.webp          modal de presente (Jardim Romântico), <= 60 KB
    public/assets/landing/presentes-cotas.webp        primeira cota (Jardim Romântico), <= 60 KB
    public/assets/landing/convidados-confirmacao.webp confirmação (Editorial Luxury), <= 50 KB
    public/assets/landing/convidados-agenda.webp      contagem regressiva (Jardim Romântico), <= 50 KB
    public/assets/landing/convidados-recado.webp      recado (Cinema Noir), <= 50 KB
    src/app/opengraph-image.jpg (+ .alt.txt)          1200x630, <= 200 KB
    src/app/icon.png (512) e src/app/apple-icon.png (180)

    public/assets/landing/capa/<id>-desktop.webp     seção Nossa história a 1440x810 @1.5 (2160x1215), <= 90 KB
    public/assets/landing/capa/<id>-phone.webp       primeira tela a 390x844 @2x reduzida p/ 640px, <= 60 KB

Fora do script (precisa de login): public/assets/landing/capa/editor.webp (editor com as chamadas do hero "capa"), <= 140 KB,
editor em Jardim Romântico com nomes, data, local, chave Pix, capa própria e slug helena-e-lucas.

Segurança: toda requisição que não for GET é abortada (nada de RSVP, recado ou Pix de
verdade) e o consentimento de cookies vai como "denied" (sem Pixel/GA4 e sem banner).
O modal de presente só é aberto ("Presentear"); "Gerar Pix" nunca é clicado.

Recapturar sempre que um modelo mudar (checklist de release) e conferir cada imagem a olho:
sem badge de dev, sem localhost, sem avisos e sem texto em inglês.
"""

import base64
import io
import re
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import Locator, Page, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
LANDING = ROOT / "public" / "assets" / "landing"
APP = ROOT / "src" / "app"

# Mesma ordem de SHOWCASE_IDS (src/components/landing/showcase.ts).
SHOWCASE = ["cinema-noir", "jardim-romantico", "garden-classico", "editorial-luxury"]
SLUG = "helena-e-lucas"
MOBILE = (390, 844)
DESKTOP = (1440, 900)

# O pôster do hero (celular de 260px, só o topo acima da dobra) precisa mostrar a tipografia de
# cada modelo: se os nomes (h1) começam abaixo disto, a página rola até eles ficarem aqui.
NAMES_TOP = 290

FOREST, BG, INK, ON_FOREST = "#2C3A24", "#F3EFE4", "#1A1E15", "#F3EFE4"

# Indicador de dev do Next e barra de demonstração (DemoBar, pelo aria-label enquanto não tiver data-demo-bar) fora das capturas.
HIDE_CSS = "nextjs-portal, [data-nextjs-toast], [data-demo-bar], aside[aria-label=\"Demonstração do modelo\"] { display: none !important; }"
# Sem a barra, o layout das demos não reserva respiro nem encurta o hero (--demo-bar-h).
HIDE_CSS += " div:has(+ [data-demo-bar]) { padding-bottom: 0 !important; --demo-bar-h: 0px !important; }"

# Fontes carregadas, reveals ligados e imagens visíveis baixadas (com teto de 15s).
SETTLE_JS = """async () => {
  await document.fonts.ready;
  document.querySelectorAll('[data-reveal]').forEach((n) => n.setAttribute('data-shown', 'true'));
  const visible = [...document.images].filter((i) => {
    const r = i.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.width > 0;
  });
  const loaded = Promise.all(visible.map((i) => i.complete ? null : new Promise((ok) => { i.onload = i.onerror = ok; })));
  await Promise.race([loaded, new Promise((ok) => setTimeout(ok, 15000))]);
}"""

# A nav fixa dos modelos cobriria o topo dos recortes (o modal ainda não existe aqui).
HIDE_FIXED_JS = """() => document.querySelectorAll('body *').forEach((n) => {
  if (getComputedStyle(n).position === 'fixed') n.style.visibility = 'hidden';
})"""

FORBIDDEN = ["Fasano", "Falha de conexão", "Welcome", "Wedding Issue", "Chave não cadastrada"]


def save(png: bytes, path: Path, max_kb: int, fmt: str = "WEBP", width: int | None = None) -> None:
    """Converte o PNG do Playwright baixando a qualidade até caber no orçamento."""
    img = Image.open(io.BytesIO(png)).convert("RGB")
    if width and img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    extra = {"method": 6} if fmt == "WEBP" else {"optimize": True, "progressive": True}
    for quality in range(84, 29, -4):
        buf = io.BytesIO()
        img.save(buf, fmt, quality=quality, **extra)
        if buf.tell() <= max_kb * 1024:
            break
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(buf.getvalue())
    kb = buf.tell() / 1024
    flag = "ok" if kb <= max_kb else "ACIMA DO LIMITE"
    print(f"  {path.parent.name}/{path.name}  {img.width}x{img.height}  {kb:.0f} KB (q{quality}, máx {max_kb}) {flag}")


def open_page(browser, base: str, mobile: bool, template_id: str, size=None, scale=None) -> Page:
    width, height = size or (MOBILE if mobile else DESKTOP)
    ctx = browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=scale or (2 if mobile else 1),
        is_mobile=mobile,
        has_touch=mobile,
        # Reduced motion deixa a captura parada (moldura já desenhada, sem zoom lento nem parallax).
        reduced_motion="reduce",
        locale="pt-BR",
        timezone_id="America/Sao_Paulo",
    )
    ctx.add_cookies([{"name": "noivar_consent", "value": "denied", "url": base}])
    page = ctx.new_page()
    page.route("**/*", lambda route: route.abort() if route.request.method != "GET" else route.continue_())
    return page


def goto_model(page: Page, base: str, template_id: str) -> None:
    page.goto(f"{base}/modelo/{template_id}/{SLUG}", wait_until="load", timeout=180_000)
    page.add_style_tag(content=HIDE_CSS)
    page.evaluate(SETTLE_JS)
    page.wait_for_timeout(1600)  # entrada do hero: até 0,9s + 0,22s de atraso
    text = page.evaluate("document.body.innerText")
    for word in FORBIDDEN:
        if word.lower() in text.lower():
            print(f"  AVISO: '{word}' aparece em /modelo/{template_id}")


def crop(page: Page, target: Locator, name: str, max_kb: int, pad: int = 16, scroll: bool = True) -> None:
    """Recorta um elemento dentro do viewport mobile (clip limitado à tela)."""
    el = target.first
    el.wait_for(state="visible", timeout=30_000)
    if scroll:
        el.evaluate("(n) => window.scrollTo({ top: n.getBoundingClientRect().top + scrollY - 32, behavior: 'instant' })")
    page.evaluate(SETTLE_JS)
    page.wait_for_timeout(1200)  # Reveal no scroll: 0,6s + atraso
    box = el.bounding_box()
    width, height = MOBILE
    x0, y0 = max(0, box["x"] - pad), max(0, box["y"] - pad)
    x1, y1 = min(width, box["x"] + box["width"] + pad), min(height, box["y"] + box["height"] + pad)
    save(page.screenshot(clip={"x": x0, "y": y0, "width": x1 - x0, "height": y1 - y0}), LANDING / name, max_kb)


def crops_jardim(page: Page) -> None:
    crop(page, page.locator('section[aria-label="Contagem regressiva"]'), "convidados-agenda.webp", 50, pad=0)
    crop(page, page.locator("#presentes li"), "presentes-cotas.webp", 60, pad=12)
    # Na demo o modal não gera Pix; o recorte é o painel do formulário (valor, nome, recado).
    page.locator("#presentes button", has_text="Presentear").first.click()
    crop(page, page.locator("dialog[open] > div"), "presentes-pix.webp", 60, pad=0, scroll=False)
    page.keyboard.press("Escape")


def crops_editorial(page: Page) -> None:
    crop(page, page.locator("#rsvp > div"), "convidados-confirmacao.webp", 50)


def crops_cinema(page: Page) -> None:
    card = page.locator("#confirmar h2", has_text="Deixe um recado").locator("xpath=..")
    crop(page, card, "convidados-recado.webp", 50)


CROPS = {"jardim-romantico": crops_jardim, "editorial-luxury": crops_editorial, "cinema-noir": crops_cinema}


def capture_models(browser, base: str) -> None:
    for template_id in SHOWCASE:
        print(template_id)
        page = open_page(browser, base, mobile=True, template_id=template_id)
        goto_model(page, base, template_id)
        # Nomes na metade de cima: na dobra de 390px só aparece o topo do pôster, e com os nomes
        # no rodapé do hero os modelos escuros viravam a mesma foto (a troca de chip "não fazia nada").
        page.evaluate(f"""() => {{
          const h = document.querySelector('h1');
          const top = h ? h.getBoundingClientRect().top : 0;
          if (top > {NAMES_TOP} + 70) window.scrollTo({{ top: top - {NAMES_TOP}, behavior: 'instant' }});
        }}""")
        page.evaluate(SETTLE_JS)
        page.wait_for_timeout(600)
        save(page.screenshot(clip={"x": 0, "y": 0, "width": 390, "height": 650}),
             LANDING / "modelos" / f"{template_id}-mobile.webp", 70)
        if template_id in CROPS:
            page.evaluate(HIDE_FIXED_JS)
            CROPS[template_id](page)
        page.context.close()


# Rola a página toda (lazy load + reveals), volta ao topo e espera todas as imagens.
LOAD_ALL_JS = """async () => {
  // decoding="async": sem sync o print de página inteira pinta a moldura cinza de fotos já baixadas.
  document.querySelectorAll('img').forEach((i) => { i.decoding = 'sync'; i.loading = 'eager'; });
  for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await new Promise((ok) => setTimeout(ok, 120));
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelectorAll('[data-reveal]').forEach((n) => n.setAttribute('data-shown', 'true'));
  const pending = [...document.images].filter((i) => !i.complete);
  await Promise.race([
    Promise.all(pending.map((i) => new Promise((ok) => { i.onload = i.onerror = ok; }))),
    new Promise((ok) => setTimeout(ok, 20000)),
  ]);
}"""

def freeze_maps(page: Page) -> None:
    """O iframe do Google Maps sai em branco no print de página inteira: troca cada um por um print dele."""
    for frame in page.locator('iframe[src*="google.com/maps"]').all():
        frame.scroll_into_view_if_needed()
        page.wait_for_timeout(2500)  # tiles do mapa
        shot = base64.b64encode(frame.screenshot()).decode()
        frame.evaluate(
            """(f, src) => {
              const img = document.createElement('img');
              img.src = src;
              img.className = f.className;
              img.style.cssText = 'display:block;width:100%;height:100%;object-fit:cover';
              f.replaceWith(img);
            }""",
            f"data:image/png;base64,{shot}",
        )
    page.evaluate("window.scrollTo({ top: 0, behavior: 'instant' })")


def capture_tours(browser, base: str) -> None:
    """Páginas inteiras que rolam dentro do MacBook e do iPhone (hover na seção Modelos)."""
    for template_id in SHOWCASE:
        print(template_id, "(página inteira)")
        for mobile, name, max_kb, width in ((False, "desktop-full", 420, 1000), (True, "mobile-full", 360, None)):
            page = open_page(browser, base, mobile=mobile, template_id=template_id)
            goto_model(page, base, template_id)
            page.evaluate(LOAD_ALL_JS)
            freeze_maps(page)
            page.wait_for_timeout(800)
            # scale="css": 1px por px de CSS também no celular (@2x passaria do limite de 16383px do WebP).
            png = page.screenshot(full_page=True, scale="css")
            if Image.open(io.BytesIO(png)).height <= 2 * (MOBILE if mobile else DESKTOP)[1]:
                print("  AVISO: a página inteira saiu curta (recarregou no meio? rode de novo)")
            save(png, LANDING / "modelos" / f"{template_id}-{name}.webp", max_kb, width=width)
            page.context.close()


def font_face(family: str, file: str, style: str = "normal") -> str:
    # ponytail: lê os woff2 de onde estiverem (public/ hoje; src/ se virarem next/font/local)
    path = next(p for d in ("public", "src") for p in (ROOT / d).rglob(file))
    data = base64.b64encode(path.read_bytes()).decode()
    return f'@font-face{{font-family:"{family}";font-style:{style};src:url(data:font/woff2;base64,{data}) format("woff2")}}'


def fonts_css() -> str:
    return (font_face("Serif", "instrument-serif.woff2")
            + font_face("Serif", "instrument-serif-italic.woff2", "italic")
            + font_face("Sans", "instrument-sans.woff2"))


def render_html(browser, html: str, width: int, height: int) -> bytes:
    page = browser.new_page(viewport={"width": width, "height": height})
    page.set_content(html, wait_until="load")
    page.evaluate("async () => { await document.fonts.load('italic 100px Serif'); await document.fonts.load('32px Sans'); await document.fonts.ready; }")
    png = page.screenshot()
    page.close()
    return png


def render_og(browser) -> None:
    platform = (ROOT / "src" / "lib" / "platform-data.ts").read_text(encoding="utf-8")
    fee = re.search(r'PUBLISH_FEE_LABEL = "([^"]+)"', platform).group(1)
    phone = base64.b64encode((LANDING / "modelos" / "cinema-noir-mobile.webp").read_bytes()).decode()
    # As três partes da linha ficam empilhadas: sem "·" pendurado quando a linha quebra.
    html = f"""<!doctype html><html><head><style>{fonts_css()}
      html, body {{ margin: 0; width: 1200px; height: 630px; overflow: hidden; background: {FOREST}; color: {ON_FOREST}; }}
      .text {{ position: absolute; left: 88px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 40px; }}
      .mark {{ font: italic 156px/0.9 "Serif"; letter-spacing: -0.01em; }}
      ul {{ list-style: none; margin: 0; padding: 0; width: 560px; font: 400 34px/1.3 "Sans"; }}
      li {{ padding: 12px 0; border-top: 1px solid rgb(243 239 228 / 0.22); }}
      .phone {{ position: absolute; right: 112px; top: 60px; width: 330px; border: 10px solid {INK}; border-radius: 46px;
               overflow: hidden; background: {INK}; box-shadow: 0 32px 80px rgb(0 0 0 / 0.35); }}
      .phone img {{ display: block; width: 100%; border-radius: 36px; }}
    </style></head><body>
      <div class="text"><div class="mark">Noivar</div>
        <ul><li>Site de casamento</li><li>Presentes via Pix sem taxa</li><li>{fee} uma vez</li></ul></div>
      <div class="phone"><img src="data:image/webp;base64,{phone}" alt=""></div>
    </body></html>"""
    save(render_html(browser, html, 1200, 630), APP / "opengraph-image.jpg", 200, fmt="JPEG")
    (APP / "opengraph-image.alt.txt").write_text(
        f"Noivar: site de casamento no celular, presentes via Pix sem taxa, {fee} uma vez.", encoding="utf-8")


def render_icons(browser) -> None:
    html = f"""<!doctype html><html><head><style>{fonts_css()}
      html, body {{ margin: 0; width: 512px; height: 512px; overflow: hidden; background: {BG}; }}
      body {{ display: grid; place-items: center; color: {FOREST}; font: italic 440px/1 "Serif"; }}
      span {{ transform: translate(-3%, 1.5%); }}  /* centro óptico do N itálico */
    </style></head><body><span>N</span></body></html>"""
    png = render_html(browser, html, 512, 512)
    icon = Image.open(io.BytesIO(png)).convert("RGB")
    icon.save(APP / "icon.png", optimize=True)
    icon.resize((180, 180), Image.LANCZOS).save(APP / "apple-icon.png", optimize=True)
    print("  src/app/icon.png (512) e src/app/apple-icon.png (180)")


def capture_capa(browser, base: str) -> None:
    """Hero da landing: computador na seção Nossa história (1440x810 @1.5) e celular na primeira tela (390x844, 640px)."""
    for template_id in SHOWCASE:
        print(template_id, "(capa)")
        page = open_page(browser, base, mobile=False, template_id=template_id, size=(1440, 810), scale=1.5)
        goto_model(page, base, template_id)
        page.evaluate(LOAD_ALL_JS)
        # O garden-classico não tem #story-title: a história é a 2ª seção, sem nav por cima.
        page.evaluate("""() => {
          const title = document.querySelector('#story-title');
          const target = title || document.querySelectorAll('section')[1];
          const top = target.getBoundingClientRect().top + scrollY - (title ? 130 : 0);
          window.scrollTo({ top, behavior: 'instant' });
        }""")
        page.evaluate(SETTLE_JS)
        page.wait_for_timeout(1200)
        save(page.screenshot(), LANDING / "capa" / f"{template_id}-desktop.webp", 90)
        page.context.close()

        page = open_page(browser, base, mobile=True, template_id=template_id)
        goto_model(page, base, template_id)
        save(page.screenshot(), LANDING / "capa" / f"{template_id}-phone.webp", 60, width=640)
        page.context.close()


def main() -> None:
    only = sys.argv[2:]
    if len(sys.argv) not in (2, 3) or not sys.argv[1].startswith("http") or only not in ([], ["tour"], ["capa"]):
        sys.exit("Uso: python scripts/capture-landing.py <URL do servidor, ex.: http://localhost:3000> [tour|capa]")
    base = sys.argv[1].rstrip("/")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        if only != ["capa"]:
            capture_tours(browser, base)
        if only != ["tour"]:
            capture_capa(browser, base)
        if not only:
            capture_models(browser, base)
            render_og(browser)
            render_icons(browser)
        browser.close()


if __name__ == "__main__":
    main()
