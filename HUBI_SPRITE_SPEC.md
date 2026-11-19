# Hubert „Hubi L4” — specyfikacja sprite'a

Status: **Character Pass 1.2 — wdrożony (idle / walk / sprint)**

Zakres: główny bohater gameplayu

Canon: **L4: The Office Escape — The story of Hubert “Hubi L4”**

Źródło: zatwierdzona plansza `art/hubi-character-pass-1.2/hubi-board-approved-1536x1024.png`. Idle to oryginalny Hubi z planszy z animacją oddechu. W walk i sprint głowa, tułów i ręce pochodzą z planszy, a nogi są rysowane klatka po klatce w cyklu kroku i biegu, bo plansza miała w każdym rzędzie 6 prawie identycznych póz nóg. Narzędzia i master 128×96 są w `art/hubi-character-pass-1.2/`. Poprzedni draft 32×44 zachowano jako `legacy-hubi-spritesheet-32x44.png`.

## Character

Hubert jest łysym, lekko grubszym pracownikiem IT. Ma ciemne prostokątne okulary, złamaną białą koszulkę, szare spodnie dresowe oraz ciemne sneakersy. Sylwetka jest cięższa i lekko nieporadna w ruchu, ale nie groteskowa. Nie ma bluzy, garnituru, broni ani cech bohatera akcji.

Najważniejsza kolejność czytelności w małej skali:

1. łysa głowa i ciemne okulary,
2. jasny, szeroki tułów,
3. szare dresy,
4. ciemne sneakersy,
5. postawa zależna od akcji.

## Frame size

- Klatka: **64×48 px** (master 128×96 w `art/`).
- Arkusz: **384×576 px**.
- Siatka: 6 kolumn × 12 wierszy (wiersze 0–3 idle, 4–7 walk, 8–11 sprint; kierunki down, up, left, right).
- Liczba klatek: **72**.
- Hubi ma ok. 43 px wysokości, tyle samo co poprzedni draft; szersza klatka mieści sprint z boku.
- Format: PNG RGBA z przezroczystością.
- Skalowanie runtime: 1× w świecie gry, nearest-neighbor przez `pixelArt: true`.

Zatwierdzone wcześniej 64×88 nie mieściło sprintu z boku bez zmniejszania postaci, dlatego klatka ma 64×48 przy skali 1×.

## Anchor / origin

- Origin X: **0.5**.
- Origin Y: **0.5**.
- Depth: zaokrąglona pozycja Y postaci.
- Kamera: bez zmian, `roundPixels: true`.

## Physics body

Rozmiar ciała jest bez zmian względem gameplay beta. Offset przeliczono na nową klatkę tak, by ciało leżało w tym samym miejscu względem środka sprite'a:

- szerokość: **24 px**,
- wysokość: **25 px**,
- offset X: **20 px** (wcześniej 4 przy klatce 32 px),
- offset Y: **19 px** (wcześniej 17 przy klatce 44 px).

Kształt sprite'a nie wyznacza kolizji.

## Animations

| Animacja | Kierunki | Klatki / kierunek | FPS | Loop | Uwagi |
|---|---|---:|---:|---|---|
| `hubi-idle-*` | down/up/left/right | 6 | 3 | tak | Oddech; zaakceptowane. |
| `hubi-walk-*` | down/up/left/right | 6 | 12 | tak | Pełny cykl kroku, rysowane nogi; zaakceptowane. |
| `hubi-sprint-*` | down/up/left/right | 6 | 12 | tak | Bieg z wysokim kolanem, ręce z planszy; zaakceptowane. |
| `hubi-carry-idle-*` | down/up/left/right | 6 | 3 | tak | Tymczasowo klatki idle + nakładka przedmiotu. |
| `hubi-carry-walk-*` | down/up/left/right | 6 | 12 | tak | Tymczasowo klatki walk + nakładka przedmiotu. |
| `hubi-phone-*` | down/up/left/right | 6 | 3 | tak | Tymczasowo klatki idle; brak telefonu przy uchu. |
| `hubi-interact-*` | down/up/left/right | 6 | 10 | nie | Tymczasowo klatki idle; nie podłączono globalnie. |

Prędkość chodu gracza: **150** (wcześniej 175), sprint bez zmian **285**.

Gwiazdka oznacza kierunek: `down`, `up`, `left`, `right`.

## Visual-state priority

W runtime wybór animacji ma kolejność:

1. `interact` — tylko po jawnym wywołaniu,
2. `phone`,
3. `carry-walk` / `carry-idle`,
4. `sprint`,
5. `walk`,
6. `idle`.

Stan ukrycia nie zmienia mechaniki ani klatki; korzysta z bieżącego idle/carry oraz istniejącego alpha/tint. Po zatrzymaniu pozostaje ostatni kierunek. Przy ruchu po skosie kierunek poziomy ma wizualny priorytet, bez zmiany velocity.

## Carry overlay

- Postać i przedmiot są osobnymi obiektami renderowania.
- Bazowa paczka: **24×18 px**.
- Duża paczka / filament L4: **30×24 px**.
- Overlay zmienia offset zależnie od kierunku i przy `up` może być renderowany za postacią.
- Kolor i etykieta nadal wynikają z danych itemu.
- W trakcie rozmowy telefonicznej overlay jest chwilowo ukryty, a po rozmowie wraca automatycznie.
- Nie zmieniono mechanicznego spowolnienia ani dostępności HideSpot.

## Phone state

- Telefon korzysta z ostatniego kierunku ruchu.
- Animacja jest aktywna tylko podczas `PhoneSystem.isConversationActive()`.
- Ruch pozostaje blokowany przez dotychczasowy system; animacja nie ustawia blokad gameplayowych.
- Po rozmowie stan wraca do carry/idle zgodnie z inventory.

## Palette

| Grupa | Kolory robocze |
|---|---|
| Outline | `#1B2228`, `#2C353C` |
| Skóra | `#B77756`, `#D99A73`, `#EDB78F` |
| Koszulka | `#BCB9B0`, `#DEDBD2`, `#F0EDE4` |
| Dresy | `#4B5259`, `#686F76`, `#858B91` |
| Okulary / buty | `#172027`, `#242B31` |
| Odbicie soczewek | `#7FA6B2` |

Paleta pozostaje kolorowa i przygaszona. Noir nie jest nakładany na gameplayowego sprite'a.

## Pixel-art notes

- Brak interpolacji i antyaliasingu.
- Główne krawędzie mają 1 px, większe bryły korzystają z klastrów 2 px.
- Detal nie może niszczyć łysiny, okularów i brzucha jako najważniejszych cech.
- Po zmianie PNG należy sprawdzić czytelność na asfalcie, chodniku, w mieszkaniu i sklepach.
- Nie dodawać cienia do samego arkusza. Ewentualny cień powinien być osobnym obiektem runtime.

## Integration

- Produkcyjny PNG: `public/assets/characters/hubi-spritesheet.png` (Character Pass 1.2).
- Narzędzia Character Pass 1.2: `art/hubi-character-pass-1.2/tools/`.
- Generator starego draftu 32×44 (nieużywany): `scripts/generate-hubi-sprites.mjs`.
- Referencyjny concept: `docs/hubi-concept-sheet.png`.
- Dane klatek i animacji: `src/data/player/player-animation-config.ts`.
- Rejestracja Phaser: `src/game/register-player-animations.ts`.
- Wybór stanu: `src/entities/player/player-visual-state.ts`.
- Runtime: `src/entities/player/player.ts` i `player-controller.ts`.
- Fallback: istniejący `player-placeholder`, używany automatycznie, jeśli PNG nie zostanie załadowany.

W trybie developerskim klawisz **F2** otwiera `HUBI ANIMATION SHOWCASE` ze stanami idle, walk, sprint, carry i phone dla czterech kierunków.
