# Grafika świata — narzędzia

1. `slice_sheet.py <arkusz.png> cut/<nazwa>` — wycina obiekty z arkusza ChatGPT (czyści mgiełkę alfy, numeruje obiekty, `_index.png` pokazuje numerację).
2. `make_tiles.py 192` — kafle podłoża 192×192 z zachowaniem ciągłości krawędzi (`src/tile-*.png` → `out/tiles`).
3. `build_world_art.py` — skaluje rekwizyty do rozmiaru w grze i generuje `src/data/world/world-art.ts` (lista tekstur i rozmieszczenie).

Oryginały z ChatGPT: `../sources/`. Wynik trafia do `public/assets/world/`.
