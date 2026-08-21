# L4: The Office Escape — Art Direction

Oficjalny tytuł: **L4: The Office Escape**  
Tagline: **The story of Hubert “Hubi L4”**

## Visual Pillars

### 1. Pixel gameplay clarity

- Gameplay jest top-down pixel artem i pozostaje przede wszystkim czytelny.
- Sylwetki gracza, NPC, kierunek jazdy auta, kryjówki, cele i pola widzenia muszą działać bez zgadywania.
- Dekoracja nigdy nie może maskować kolizji, drzwi ani punktu interakcji.
- Używamy jednej siatki bazowej: rekomendowane 16×16 lub 32×32, skalowane całkowicie z nearest-neighbor.

### 2. Noir narrative presentation

- Title, opening, ważne interstitiale i wybrane plansze fabularne korzystają z czerni, złamanej bieli, szarości i czerwieni.
- Kadry są wysokokontrastowe, z cieniem, deszczem i kontrolowanym ziarnem.
- Noir nie zastępuje świata gameplayowego. To rama narracyjna i branding.

### 3. Black comedy contrast

- Forma jest śmiertelnie poważna; treść pozostaje absurdalna.
- Kabel RJ-45 może być pokazany jak dowód zbrodni, ale nigdy jak broń palna.
- Drukarka 3D jest traktowana z dramaturgią należną reaktorowi atomowemu.
- Humor ma wynikać z kadru, rytmu i konsekwentnego deadpan, nie z przypadkowych gagów.

### 4. Polish urban atmosphere

- Osiedle: bloki, kostka, parking, kioski usługowe, krzaki, kontenery, przypadkowe ławki i techniczne dobudówki.
- Unikamy pocztówkowej Polski i nadmiaru flag/symboli. Lokalność budują detale użytkowe.
- Wszystkie sklepy pozostają fikcyjne.

## Color direction

### Gameplay palette

| Funkcja | Kierunek | Przykładowe wartości |
|---|---|---|
| Zieleń osiedla | zgaszona, użytkowa | `#54794D`, `#31572C` |
| Beton / asfalt | chłodne szarości | `#343A40`, `#6C757D`, `#B7B0A3` |
| Mieszkanie | ciepłe, lekko zużyte | `#C9B79C`, `#9C6644` |
| Interakcja | chłodny cyjan | `#8ECAE6` |
| Ostrzeżenie | żółty | `#FFD166` |
| Wykrycie | czerwony | `#EF233C` |

Kolory gameplayowe mają zachowywać kontrast niezależnie od noir brandingu. Czerwony jest rezerwowany dla zagrożenia i głównego akcentu.

### Noir palette

- Tło: `#030405`, `#060708`, `#111318`.
- Złamana biel: `#F2EFE8`, nie czysta biel na dużych powierzchniach.
- Szarości: `#707176`, `#A8A8A8`, `#D4D0C6`.
- Akcent czerwony: `#DF293F` / `#B51F32`.
- Złoto może wystąpić tylko jako mały detal metaliczny RJ-45, nie drugi kolor brandu.

### UI accents

- Dialogue / neutral: złamana biel i chłodny błękit.
- Warning / detection: żółty → czerwony zgodnie z wagą.
- Success: stonowana zieleń.
- Duży czerwony akcent nie może konkurować jednocześnie w więcej niż dwóch miejscach ekranu.

## Character direction

### Hubert “Hubi L4”

- Łysy, okulary, grubsza sylwetka, zwykły człowiek i informatyk.
- Gameplay: jasna koszulka, szare dresy, sneakersy; duża czytelna głowa i okulary.
- Noir portrait: poważny, zmęczony, „człowiek po przejściach”, ale bez płaszcza mafiosa, militariów lub pozy bohatera akcji.
- RJ-45 jest jego kanonicznym rekwizytem brandingu. Druk 3D jest rekwizytem codzienności.

### Coworker

- Najbardziej zwyczajny z przeciwników: codzienny ubiór, torba lub kubek.
- Czytelna, spokojna paleta. Nie wygląda groźniej od HR/managera.

### HR

- Elegancki, uporządkowany strój, identyfikator, teczka lub telefon.
- Sylwetka sugeruje rozmowę i podejście, nie fizyczny pościg.

### Manager

- Wyraźniejszy kontrast i cięższa sylwetka niż HR.
- Czerwony detal jest dozwolony, ale bez kostiumu „bossa”. Groza wynika z uporczywości AI.

### ZUS

- Fikcyjna urzędowa figura: geometryczna, spokojna, niemal nieruchoma.
- Nigdy potwór ani bojowy boss. Finał zmienia formę, nie eskaluje przemocy.

## Environment direction

### Apartment

- Najcieplejsza lokacja, ale daleka od idealnego katalogowego wnętrza.
- Półki i biurko pokazują progresję: szpule, kable, pudełka, dysza, wydruki, wielkie `L4`.
- Każdy element progresji ma stały slot albo dobrze zdefiniowany obszar, aby clutter pozostał czytelny.

### Polish block estate

- Powtarzalne moduły bloków, zmęczone kolory elewacji, chodnik i parking organizują mapę.
- Osłony stealth mają czytelne bryły: narożnik bloku, kontener, krzak, zaparkowane auto.
- Reklamy i szyldy są oszczędne, fikcyjne, pisane wielkimi prostymi literami.

### Service points / shops

- Każdy punkt ma jeden dominujący kolor i jeden charakterystyczny prop.
- `CHWILKA`: zieleń i lada. Apteka: chłodna zieleń/biel. 3D shop: uporządkowane kolorowe szpule. Tech Shop: granat/szarość. Kebab: ciepła czerwień.

### Roads / parking

- Kierunek tras company car musi być widoczny z układu ulic, pasów i wyjazdów.
- Samochód powinien dawać sygnał nadjazdu sylwetką i światłami, bez minimapy.

## Narrative presentation rules

### Używaj noir panels, gdy

- rozpoczyna się nowa gra,
- pojawia się kluczowa zmiana fabularna lub miesięczny interstitial,
- forma ma zatrzymać tempo i nadać absurdowi wagę,
- ekran promuje grę poza gameplayem.

### Używaj pixel gameplay, gdy

- gracz steruje postacią,
- liczy się stealth, line of sight lub interakcja,
- aktywne są NPC, telefon, objective lub HUD.

### Transition rules

- Fade 200–500 ms; bez gwałtownych białych błysków.
- Ważny tekst przechodzi ręcznie E/Space. Pierwszy input kończy typewriter, kolejny zmienia planszę.
- ESC może pominąć opening, ale nie przypadkowo pomijać zwykłych dialogów kampanii.
- Noir scene nie renderuje gameplay HUD, telefonu ani alertów.
- Tła openingu mają stabilne klucze z `brand-config.ts`; finalny obraz zastępuje proceduralny fallback bez zmiany flow.

## Typography

- Title: ciężki grotesk, ciasny, surowy, wielkie litery; czerwone `L4`, reszta złamana biel.
- Narration: monospace lub surowy grotesk, krótkie wersy, dużo oddechu.
- Tagline: mniejszy elegancki serif/italic, nigdy bardziej dominujący niż tytuł.
- Gameplay UI pozostaje monospace dla zgodności i czytelności.
- Nie kopiujemy lockupu ani fontów identyfikujących konkretną grę lub film.

## Humor rules

- Pisz jak narrator kryminału, nawet gdy tematem jest restart routera.
- Najpierw ustaw poważny kontekst, potem pokaż absurd; nie wyjaśniaj dowcipu.
- Unikaj lawiny gagów, emotikonów i slapsticku.
- Powtarzalne żarty (`Warto.`, „ostatnia szpula”) działają przez konsekwencję, nie eskalację krzyku.
- ZUS pozostaje jednoznacznie satyryczną mechaniką, nie poradą prawną ani medyczną.

## Accessibility / readability guardrails

- Informacji stealth nie kodujemy wyłącznie kolorem: ikona + tekst + kolor.
- Grain i deszcz nie mogą zasłaniać napisów ani obiektów gameplayowych.
- W finalnym polishu należy dodać opcję ograniczenia migania i intensywności overlayów.
- Layout projektujemy dla 960×540 i testujemy przy skalowaniu FIT na 1920×1080, 1440×900 oraz 1366×768.

