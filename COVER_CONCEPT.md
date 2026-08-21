# L4: The Office Escape — Cover Concept

## Brand lockup

**Title:** `L4: The Office Escape`  
**Tagline:** `The story of Hubert “Hubi L4”`

Okładka ma wyglądać jak śmiertelnie poważny plakat noir/pulp crime o katastrofie infrastruktury. Jej centralnym żartem jest to, że „dowodem zbrodni” pozostaje kabel RJ-45.

> **CODE-GENERATED CHARACTER ART: FORBIDDEN FOR FINAL COVER**

Finalna postać, kabel i serwerownia muszą pochodzić z osobnego, profesjonalnie przygotowanego assetu ilustracyjnego. Phaser Graphics, SVG/CSS shapes, canvas primitives oraz proceduralne figury nie są akceptowalnym zamiennikiem key artu.

## One-sentence brief

Łysy, grubszy informatyk w okularach stoi w deszczu przed martwą serwerownią, trzymając odłączony kabel RJ-45 z taką powagą, jakby właśnie zrozumiał skalę katastrofy — bez broni, bez pozy bohatera akcji, bez kopiowania konkretnej franczyzy.

## Bohater

- Hubert zajmuje około 40–50% wysokości kadru.
- Ujęcie od pasa lub klatki piersiowej; lekko z dołu, ale bez heroicznego „power pose”.
- Łysa głowa i okulary muszą być rozpoznawalne w miniaturze.
- Sylwetka pozostaje grubsza i zwyczajna. Twarz poważna, zmęczona, trochę zagubiona.
- Ubranie może być bardziej graficzne/noir niż gameplayowe, ale zachowuje jasną koszulkę lub zwyczajny IT casual. Bez płaszcza gangstera, kamizelki taktycznej i garnituru hitmana.

## RJ-45 — główny rekwizyt

- Kabel biegnie po przekątnej przez kompozycję i prowadzi wzrok do dłoni Huberta.
- Wtyczka jest dostatecznie duża, by widz rozpoznał RJ-45: przezroczysty korpus, zatrzask, złote styki.
- Czerwony przewód lub czerwone światło może być głównym akcentem.
- Rekwizyt wygląda jak dowód rzeczowy / przyczyna awarii, nie jak bicz, nóż ani broń.
- **Bezwzględny zakaz:** pistolet, kabura, amunicja, militaria, lufa, celownik.

## Tło

- Główne tło: ciemna serwerownia, szafy rack, patchpanele, przewody, wygaszone diody i pojedyncze czerwone kontrolki.
- Serwerownia jest ważniejsza od miejskiego skyline’u; miasto może istnieć wyłącznie jako drugorzędny ślad za szybą lub w odbiciu.
- Detale opcjonalne: taśma oznaczeniowa kabli, przewrócony kubek, czarny ekran terminala.
- Nie dodawać tłumu NPC ani sceny akcji. Izolacja wzmacnia absurdalną wagę wydarzenia.

## Kolorystyka i światło

- 70% czerń / grafit, 20% złamana biel / szarość, maksymalnie 10% czerwony akcent.
- Twarde boczne światło modeluje okulary, łysą głowę i dłoń z wtyczką.
- Czerwień pochodzi z kabla, awaryjnej lampy albo prostego bloku graficznego — nie ze „strzelaniny”.
- Deszcz i ziarno pozostają subtelne. Tekst ma najwyższy kontrast.

## Typografia

- `L4:` największe, czerwone, zwarte.
- `The Office Escape` w złamanej bieli, ciężki surowy grotesk, mniej więcej 55–70% wysokości `L4`.
- Tagline mały, elegancki serif/italic lub lżejszy grotesk: `The story of Hubert “Hubi L4”`.
- Nie używać krojów, ramek ani układu kojarzącego się jednoznacznie z konkretną grą, filmem albo serialem.
- Tekst zawsze składany jako osobna, edytowalna warstwa; nie wypalać ostatecznego logotypu w ilustrację źródłową.

## Kompozycja pozioma — title / 16:9

- Format źródłowy: 3840×2160; safe area 16:9 z marginesem 6%.
- Lewa 45%: title lockup i menu; należy pozostawić spokojny negatyw.
- Prawa 55%: Hubert, ręka, wtyczka RJ-45 i serwerownia.
- Kabel może wejść z dolnego lewego rogu i połączyć strefę menu z bohaterem.
- Twarz i wtyczka nie mogą wypaść pod menu lub kadrowanie 1200×630.

## Kompozycja pionowa — cover / 2:3

- Format źródłowy: 2400×3600.
- Górne 25%: title lockup.
- Środkowe 45%: Hubert i wtyczka; twarz nieco powyżej środka.
- Dolne 30%: wijący się kabel, fragment szafy rack i tagline.
- Tło upraszczać ku dołowi, aby czerwony kabel pozostał czytelny w miniaturze.

## Kompozycja social — 1200×630

- Zachować czytelność tytułu przy szerokości 320 px.
- Hubert po prawej; title po lewej; tagline pod tytułem.
- Nie umieszczać ważnych elementów w skrajnych 60 px.
- To wariant promocyjny, nie źródło finalnego logo.

## Materiał źródłowy i eksport

- Finalna kompozycja pozioma jest dostarczona bez tekstu jako `public/assets/branding/title-key-art.png` (1672×941).
- W pliku źródłowym: osobna warstwa tła serwerowni, Huberta oraz kabla/wtyczki.
- Osobny title lockup i tagline.
- Eksporty: `title-key-art.png`, przyszły przezroczysty lockup promocyjny, `cover-vertical.png`, `social-card.png`.
- Gra oczekuje klucza `branding/title-key-art`. Build automatycznie wykrywa obecność pliku `title-key-art.png`; brak pliku uruchamia celowo oszczędny, ciemny fallback bez postaci.
- Ilustracja nie zawiera wypalonego logo, tagline’u ani menu — te elementy pozostają edytowalne w grze.
- Logo w title screen jest osobnym, reużywalnym lockupem tekstowym (`title-logo-lockup.ts`) i nie jest częścią rastra.

## Acceptance checklist

- [ ] Dokładny tytuł i tagline.
- [ ] Hubert jest łysy, w okularach i ma zwyczajną, grubszą sylwetkę.
- [ ] RJ-45 jest jednoznacznie rozpoznawalny.
- [ ] Brak broni palnej i kodów wizualnych komandosa/mafiosa/hitmana.
- [ ] Kompozycja pozostaje czytelna w miniaturze.
- [ ] Czerwony akcent nie dominuje nad czernią i bielą.
- [ ] Atmosfera jest poważna; żart wynika z rekwizytu.
- [ ] Materiał nie kopiuje konkretnego plakatu, gry ani franczyzy.
- [ ] Finalny cover nie zawiera programowo generowanej postaci ani proceduralnego key artu.
