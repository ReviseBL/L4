# Hubi Character Pass 1.2 — narzędzia

Kolejność (Python 3 + Pillow + NumPy + SciPy), uruchamiać z katalogu roboczego zawierającego `src/board.png`
(= `../hubi-board-approved-1536x1024.png`):

1. `split.py` — wykrywa 72 komórki planszy → `cells.json`
2. `build.py` — wycina i czyści alfę → `out/hubi-spritesheet-master-128x96.png` (wersja surowa)
3. `rig.py` — idle (oddech) → `out/rig-master.png`
4. `final.py` — rejestracja oryginalnych klatek → `out/final-master.png`
5. `build_drawn.py` (+ `legs.py`) — finalny arkusz: idle z `rig`, walk/sprint = góra z planszy + nogi rysowane
   → `out/drawn-master.png` (128×96) i `out/hubi-spritesheet.png` (64×48, do gry)
6. `preview.py`, `runpreview.py` — podglądy GIF

Układ arkusza: 6 kolumn × 12 wierszy; wiersze 0–3 idle, 4–7 walk, 8–11 sprint; kierunki w kolejności down, up, left, right.
