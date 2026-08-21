# L4: The Office Escape — Asset Manifest

Status dokumentu: **visual/content polish — etap 2: Hubi**
Branding: **L4: The Office Escape**  
Tagline: **The story of Hubert “Hubi L4”**

## Jak czytać manifest

- `placeholder` — działa w grze, ale ma zostać wymieniony.
- `draft` — spójny, zintegrowany asset produkcyjny do oceny; przed wydaniem wymaga ręcznego pixel-artowego passu.
- `partial` — kierunek i integracja są gotowe, asset wymaga produkcyjnego opracowania.
- `missing` — brak dedykowanego assetu; obecnie używany jest kształt, tekst lub neutralne tło.
- `final-ready` — można pozostawić bez zmian na potrzeby wydania.
- Rozmiary są rozmiarami źródłowymi. Eksport może korzystać z integer scale i nearest-neighbor.

## Branding

| Asset | Status | Typ | Orientacyjny rozmiar | Priorytet | Uwagi |
|---|---|---|---:|---|---|
| Title logo | final-ready / text lockup | Phaser Text + osadzony font DejaVu Sans Bold | 320×185 w bazie 960×540 | high | Osobna, reużywalna warstwa `title-logo-lockup.ts`; czerwone `L4:` i off-white `THE OFFICE / ESCAPE`. Nie jest wypalona w key arcie. |
| Title key art | final-ready | PNG, zewnętrzna ilustracja pixel-noir | 1672×941 | high | Zaakceptowany asset `public/assets/branding/title-key-art.png`, klucz `branding/title-key-art`, focal point 72% / 48%. |
| Cover art — vertical | missing | ilustracja rastrowa | 2400×3600 | high | Brief w `COVER_CONCEPT.md`. Bez broni palnej. |
| Cover art — horizontal | final-ready | ilustracja rastrowa | 1672×941 | high | Finalny key art title screen: serwerownia, młody Hubert i czytelny czerwony RJ-45. |
| Tagline treatment | final-ready | Phaser Text + osadzony DejaVu Serif | 320×24 w bazie 960×540 | medium | Tekst dokładny: `The story of Hubert “Hubi L4”`; osobna warstwa, italic. |
| Social preview | partial | PNG | 1200×630 | medium | Wymienny preview hostowanej wersji, nie finalna okładka. |

## Player

| Asset | Status | Typ | Orientacyjny rozmiar | Priorytet | Uwagi |
|---|---|---|---:|---|---|
| Hubi base sprite | draft | PNG sprite sheet, 4 kierunki | 32×44 / klatkę | high | 104 klatki; spójna łysa sylwetka, okulary, jasna koszulka, szare dresy. Mechaniczny fallback zachowany. |
| Hubert idle | draft | 4 kierunki × 2 klatki | 32×44 / klatkę | high | 3 FPS, subtelny oddech. |
| Hubert walk | draft | 4 kierunki × 6 klatek | 32×44 / klatkę | high | 8 FPS, cięższy krok. |
| Hubert sprint | draft | 4 kierunki × 6 klatek | 32×44 / klatkę | high | 12 FPS, bardziej pochylona sylwetka bez slapsticku. |
| Hubert carry | draft | animacja + osobna nakładka | 32×44 + 24×18/30×24 | high | Idle 2 klatki, walk 4; duża paczka odróżniona rozmiarem. |
| Hubert phone | draft | 4 kierunki × 3 klatki | 32×44 / klatkę | medium | Zachowuje ostatni kierunek, aktywna podczas rozmowy. |
| Hubert interact | draft / asset-ready | 4 kierunki × 3 klatki | 32×44 / klatkę | medium | Nie podłączono globalnie, aby nie przebudowywać InteractionSystem. |
| Hubert hide | partial | istniejąca animacja + tint | 32×44 | medium | Mechanika bez zmian; osobna poza nie jest potrzebna przy obecnym alpha. |
| Hubert noir portrait | partial | portret / ilustracja | 1024×1024 | high | Ten sam bohater co sprite; bez wyglądu komandosa lub mafiosa. |

## NPC

| Asset | Status | Typ | Orientacyjny rozmiar | Priorytet | Uwagi |
|---|---|---|---:|---|---|
| Coworker | placeholder | sprite sheet, 4 kierunki | 32×44 / klatkę | high | Codzienny ubiór biurowy, natychmiast odróżnialny od Huberta. |
| HR | placeholder | sprite sheet, 4 kierunki | 32×44 / klatkę | high | Elegancki strój, identyfikator, teczka/telefon. |
| Manager | placeholder | sprite sheet, 4 kierunki | 32×44 / klatkę | high | Mocniejsza sylwetka i czerwony akcent, bez karykatury gangstera. |
| ZUS | placeholder | portret + top-down figure | 32×44 i 512×512 | medium | Urzędowa, fikcyjna, satyryczna prezentacja. |
| Company car | placeholder | sprite sheet / obroty | 72×46 / klatkę | high | Fikcyjne oznaczenie, czytelny przód auta i światła. |
| NPC detection icons | partial | ikony | 16×24, 32×32 | high | `?`, `!`, `!!!`; obecnie tekst. |

## Environment

| Asset | Status | Typ | Orientacyjny rozmiar | Priorytet | Uwagi |
|---|---|---|---:|---|---|
| Apartment tiles | placeholder | tileset | siatka 16×16 lub 32×32 | high | Hub kampanii; warianty z progresją bez zmiany kolizji. |
| Streets / pavement | placeholder | tileset | siatka 16×16 lub 32×32 | high | Polska kostka, asfalt, przejścia, krawężniki. |
| Block estate buildings | placeholder | tileset + facades | moduły 32×32 | high | Bloki, klatki, balkony, zsypy; bez fotorealizmu. |
| Small grocery | placeholder | tileset + signage | moduły 32×32 | medium | Fikcyjny branding `CHWILKA`. |
| Pharmacy | placeholder | tileset + signage | moduły 32×32 | medium | `NA WSZELKI WYPADEK`; żadnych prawdziwych marek. |
| 3D Print Shop | placeholder | tileset + signage | moduły 32×32 | high | Kolorowe, czytelne szpule i techniczne półki. |
| Tech Shop | placeholder | tileset + signage | moduły 32×32 | medium | Neutralny sklep komputerowy. |
| Kebab | placeholder | kiosk tiles | moduły 32×32 | low | Mały, rozpoznawalny punkt odbioru. |
| Parcel locker | placeholder | prop / tiles | 64×96 | medium | Generyczny automat, bez prawdziwego logo. |
| Car park | placeholder | tiles + props | moduły 32×32 | medium | Linie, auta-osłony, czytelne drogi company car. |
| ZUS office / corridor | placeholder | tileset | siatka 16×16 lub 32×32 | medium | Inny język wizualny niż osiedle, nadal pixel art. |

## Props

| Asset | Status | Typ | Orientacyjny rozmiar | Priorytet | Uwagi |
|---|---|---|---:|---|---|
| 3D printer | placeholder | animated prop | 64×64, 4–8 klatek | high | Czytelny ruch głowicy i status pracy. |
| Filament spools | placeholder | prop variants | 24×24 | high | Typ materiału niezależny od samego koloru. |
| RJ-45 cable | partial | key prop + world icon | 256×256 / 24×24 | high | Główny symbol brandingu; nie stylizować na broń palną. |
| Desk / monitors / keyboard | placeholder | prop set | moduły 16×16/32×32 | medium | Progresywnie bardziej zagracone biurko. |
| L4 — WERSJA 400% | placeholder | large prop | 128×96 | high | Duże przestrzenne `L4`, trwały payoff kampanii. |
| Packages | placeholder | carry props | 24×24 i 40×32 | medium | Mała i duża paczka muszą się różnić. |
| Nozzle 0.6 mm | placeholder | item icon + desk prop | 24×24 | medium | Metaliczna dysza / pudełko przy drukarce. |
| USB-C cable | placeholder | item icon + desk prop | 24×24 | medium | Inny kształt końcówki niż RJ-45. |
| Food / kebab | placeholder | item + carry prop | 24×24 | low | Czytelny papierowy pakunek. |

## UI

| Asset | Status | Typ | Orientacyjny rozmiar | Priorytet | Uwagi |
|---|---|---|---:|---|---|
| Title menu | final-ready | Phaser UI + finalny key art | 960×540 | high | Tekstowe menu z czerwonym markerem, osobny lockup, finalny PNG, cover-fit bez rozciągania i ciemny fallback. |
| DialogueBox | partial | 9-slice / Phaser UI | 924×148 | high | Funkcjonalny; później ujednolicić z noir interstitialami bez utraty czytelności. |
| Phone panel | placeholder | panel + icon set | 280×160 | medium | Priorytet po postaciach i title art. |
| Alerts | placeholder | panel + icon set | 320×56 | medium | Hierarchia treści już działa; potrzebuje spójnych ramek. |
| Mission summary | placeholder | panel | 760×430 | medium | Wymaga tylko stylizacji, bez zmian danych. |
| Month transition | placeholder | full-screen panel | 960×540 | medium | Dobry kandydat do noir interstitial system. |
| End screens | placeholder | full-screen panel | 960×540 | medium | Zachować wynik i rangę jako główną hierarchię. |
| ZUS finale UI | placeholder | panels + document cards | 960×540 | medium | Surowa urzędowa estetyka z kontrolowanym absurdem. |
| Credits | partial | Phaser overlay | 650×360 | low | Branding wdrożony, lista produkcyjna do uzupełnienia. |

## FX / overlays

| Asset | Status | Typ | Orientacyjny rozmiar | Priorytet | Uwagi |
|---|---|---|---:|---|---|
| Rain overlay | partial | shader/texture overlay | 960×540 tile | medium | Title używa bardzo subtelnej warstwy atmosferycznej; opening pozostaje bez zmian. |
| Film grain | partial | seamless overlay | 256×256 | medium | Title używa lekkiego proceduralnego ziarna, które nie pełni funkcji ilustracji. |
| Noir transition panels | partial | scena + background slots | 960×540 | high | `OpeningScene` i `NoirNarrativeView` stanowią pipeline. |
| Fade / blackout | final-ready | camera transition | n/a | low | Funkcjonalne przejścia bez zewnętrznego assetu. |
| Vision cones | partial | Phaser geometry | runtime | high | Mechanicznie finalne; wizualny tuning dopiero po tilesecie. |
| HideSpot marker | placeholder | world icon | 24×24 | high | Obecne `H`; wymienić na symbol czytelny bez debugowego charakteru. |

## Kolejność produkcji po etapie 1

1. Finalny title key art + logo lockup + noir portret Huberta.
2. Hubert: idle/walk/sprint/carry oraz coworker/HR/manager.
3. Podstawowy tileset mieszkania i osiedla z zachowaniem obecnych kolizji.
4. Najważniejsze propsy stealth: HideSpot, company car, drukarka i szpule.
5. Docelowe ilustracje openingu pod istniejące klucze assetów.
6. UI skin i dopiero potem drugorzędne dekoracje.
