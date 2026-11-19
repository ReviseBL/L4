# NPC — narzędzia (ten sam pipeline co Hubi)

Wejście: plansza z 4 stojącymi pozami (przód, tył, lewo, prawo) na przezroczystym tle.

    python3 extract.py <plansza.png> <nazwa>_tiles 88     # wycina i skaluje do wzrostu Hubiego
    python3 npc_build.py <nazwa>_tiles.npy <nazwa>.json <nazwa>   # idle (oddech) + chód (rysowane nogi)
    python3 npc_preview.py <nazwa> 92                     # podgląd GIF

`<nazwa>.json` opisuje kolory spodni/butów, linię bioder i szerokość nóg (przykład: `coworker.json`).
Wynik: `out/<nazwa>-spritesheet.png`, 6 kolumn × 8 wierszy po 64×48 (idle ×4 kierunki, walk ×4 kierunki).
