"""
Gera os woff2 de correção do circunflexo minúsculo da Cormorant Garamond (v4.001,
a variável que o next/font baixa do Google Fonts).

Causa: nessa versão o acento de â ê î ô û é um "Λ" de traço fino com 259 unidades
de altura (o do Ê maiúsculo tem 111), por isso ele parece solto/duplicado em pt-BR.
Correção: instancia em wght 400 e troca o contorno do acento minúsculo pelo do Ê
(mesmo desenho, 13 pontos), centrado onde o acento original estava e apoiado na
mesma base (y=471). Só esses 5 glifos vão no arquivo; o modelo carrega com
unicode-range, então todo o resto continua vindo da Cormorant original.

Entrada: o woff2 "latin" da Cormorant Garamond (normal ou itálico) que o next/font
salva em .next/**/static/media. Precisa de fontTools + brotli.
Uso: python -I patch-circumflex.py <cormorant-latin.woff2> <saida.woff2> [escala_x] [escala_y]
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.subset import Subsetter, Options

src, out = sys.argv[1], sys.argv[2]
sx = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
sy = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
BASES = "aeiou"
UNI = [ord(c) for c in "âêîôû"]

font = instantiateVariableFont(TTFont(src), {"wght": 400})
glyf = font["glyf"]


def last_contour(name):
    g = glyf[name]
    coords, ends, flags = g.getCoordinates(glyf)
    start = ends[-2] + 1
    return g, coords, flags, start, ends[-1] + 1


_, scoords, sflags, s0, s1 = last_contour("Ecircumflex")
src_pts = list(scoords[s0:s1])
src_flags = list(sflags[s0:s1])
scx = (min(p[0] for p in src_pts) + max(p[0] for p in src_pts)) / 2
sminy = min(p[1] for p in src_pts)

for b in BASES:
    name = b + "circumflex"
    g, coords, flags, a0, a1 = last_contour(name)
    assert a1 - a0 == len(src_pts), (name, a1 - a0)
    acc = coords[a0:a1]
    cx = (min(p[0] for p in acc) + max(p[0] for p in acc)) / 2
    base_y = min(p[1] for p in acc)
    for i, (x, y) in enumerate(src_pts):
        coords[a0 + i] = (round(cx + (x - scx) * sx), round(base_y + (y - sminy) * sy))
        flags[a0 + i] = src_flags[i]
    g.coordinates = coords
    g.flags = flags
    g.recalcBounds(glyf)

opts = Options()
opts.layout_features = []
opts.name_IDs = ["*"]
opts.name_languages = ["*"]
opts.notdef_outline = True
opts.flavor = "woff2"
sub = Subsetter(opts)
sub.populate(unicodes=UNI)
sub.subset(font)

# Nome próprio (a OFL pede renomear versões modificadas); copyright (ID 0) fica.
italic = "Italic" in (font["name"].getDebugName(2) or "") or font["post"].italicAngle != 0
style = "Italic" if italic else "Regular"
for nid, val in {1: "CN Circumflex", 2: style, 4: f"CN Circumflex {style}", 6: f"CNCircumflex-{style}",
                 13: "This Font Software is licensed under the SIL Open Font License, Version 1.1.",
                 14: "https://openfontlicense.org", 16: None, 17: None}.items():
    font["name"].removeNames(nameID=nid)
    if val:
        font["name"].setName(val, nid, 3, 1, 0x409)
font.flavor = "woff2"
font.save(out)
print(out, "ok")
