# Hubert „Hubi L4” — specyfikacja sprite'a

Status: **produkcyjny draft pixel-artowy**

Zakres: główny bohater gameplayu

Canon: **L4: The Office Escape — The story of Hubert “Hubi L4”**

Draft jest kompletnym, działającym zestawem do testów wizualnych i może pozostać mechanicznym fallbackiem. Nie jest jeszcze ręcznie dopieszczonym finalnym sprite'em ilustratora.

## Character

Hubert jest łysym, lekko grubszym pracownikiem IT. Ma ciemne prostokątne okulary, złamaną białą koszulkę, szare spodnie dresowe oraz ciemne sneakersy. Sylwetka jest cięższa i lekko nieporadna w ruchu, ale nie groteskowa. Nie ma bluzy, garnituru, broni ani cech bohatera akcji.

Najważniejsza kolejność czytelności w małej skali:

1. łysa głowa i ciemne okulary,
2. jasny, szeroki tułów,
3. szare dresy,
4. ciemne sneakersy,
5. postawa zależna od akcji.

## Frame size

- Klatka: **32×44 px**.
- Arkusz: **256×572 px**.
- Siatka: 8 kolumn × 13 wierszy.
- Liczba klatek: **104**.
- Format: PNG RGBA z przezroczystością.
- Skalowanie runtime: 1× w świecie gry, nearest-neighbor przez `pixelArt: true`.

Wybrano 32×44 zamiast 32×48, ponieważ dokładnie taki rozmiar posiadał działający placeholder. Pozwala to zachować dotychczasową geometrię bez kompensowania pozycji ciała fizycznego.

## Anchor / origin

- Origin X: **0.5**.
- Origin Y: **0.5**.
- Depth: zaokrąglona pozycja Y postaci.
- Kamera: bez zmian, `roundPixels: true`.

## Physics body

Parametry są zamrożone i identyczne z wersją gameplay beta:

- szerokość: **24 px**,
- wysokość: **25 px**,
- offset X: **4 px**,
- offset Y: **17 px**.

Kształt sprite'a nie wyznacza kolizji. Wymiana PNG nie może zmieniać tych wartości.

## Animations

| Animacja | Kierunki | Klatki / kierunek | FPS | Loop | Uwagi |
|---|---|---:|---:|---|---|
| `hubi-idle-*` | down/up/left/right | 2 | 3 | tak | Subtelny oddech. |
| `hubi-walk-*` | down/up/left/right | 6 | 8 | tak | Cięższy krok i umiarkowany ruch tułowia. |
| `hubi-sprint-*` | down/up/left/right | 6 | 12 | tak | Większy wykrok i lekko pochylona sylwetka. |
| `hubi-carry-idle-*` | down/up/left/right | 2 | 3 | tak | Ręce przygotowane pod osobną nakładkę. |
| `hubi-carry-walk-*` | down/up/left/right | 4 | 7 | tak | Wspólna animacja dla paczek i filamentu. |
| `hubi-phone-*` | down/up/left/right | 3 | 3 | tak | Telefon przy uchu, zachowuje ostatni kierunek. |
| `hubi-interact-*` | down/up/left/right | 3 | 10 | nie | Asset-ready; nie podłączono globalnie do interakcji. |

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

- Produkcyjny draft PNG: `public/assets/characters/hubi-spritesheet.png`.
- Generator deterministycznego draftu: `scripts/generate-hubi-sprites.mjs`.
- Referencyjny concept: `docs/hubi-concept-sheet.png`.
- Dane klatek i animacji: `src/data/player/player-animation-config.ts`.
- Rejestracja Phaser: `src/game/register-player-animations.ts`.
- Wybór stanu: `src/entities/player/player-visual-state.ts`.
- Runtime: `src/entities/player/player.ts` i `player-controller.ts`.
- Fallback: istniejący `player-placeholder`, używany automatycznie, jeśli PNG nie zostanie załadowany.

W trybie developerskim klawisz **F2** otwiera `HUBI ANIMATION SHOWCASE` ze stanami idle, walk, sprint, carry i phone dla czterech kierunków.
