# L4: The Office Escape

**The story of Hubert “Hubi L4”**

Kompletna, edytowalna wersja przeglądarkowej gry stealth 2D zbudowanej w TypeScript, Phaser 3 i Vite. Repozytorium zawiera kampanię M1–M6, finał ZUS, zapis lokalny, narzędzia developerskie, testy oraz wszystkie używane assety.

## Requirements

- Node.js `22.13.0` lub nowszy z linii 22.x
- npm `10` lub nowszy
- nowoczesna przeglądarka desktopowa

## Install

Instalacja deterministyczna na podstawie `package-lock.json`:

```bash
npm ci
```

Podczas zwykłej pracy lokalnej można również użyć `npm install`.

## Local Development

```bash
npm run dev
```

Vite wyświetli lokalny adres aplikacji. W trybie developerskim panel debugowania jest dostępny automatycznie.

## Build

```bash
npm run build
```

Gotowa statyczna aplikacja trafia do `dist/`. Podgląd buildu:

```bash
npm run preview
```

## Tests

```bash
npm run typecheck
npm run lint
npm run test
npm run verify:package
npm run build
```

- `typecheck` — TypeScript bez emisji plików,
- `lint` — ESLint,
- `test` — Vitest i testy czystej logiki gameplayu,
- `verify:package` — obecność wymaganych assetów i brak ścieżek zależnych od workspace,
- `build` — produkcyjny build Vite.

## Project structure

- `src/scenes/` — sceny Phaser, w tym menu, opening, gameplay i finał ZUS.
- `src/systems/` — systemy kampanii, misji, podejrzliwości, telefonu, dialogów, zapisu i progresji.
- `src/domain/` — typy i logika domenowa niezależna od renderera.
- `src/data/` — dane miesięcy, misji, dialogów, NPC, balansu i progresji.
- `src/entities/` — gracz oraz kontrolery zagrożeń.
- `src/debug/` — narzędzia i scenariusze developerskie.
- `src/ui/` — HUD, dialogue box, title screen i prezentacja narracyjna.
- `public/assets/` — rasterowe assety ładowane w runtime.
- `src/assets/fonts/` — osadzone fonty i ich licencja.
- `tests/` — testy Vitest.
- `docs/` oraz dokumenty `*.md` w katalogu głównym — dokumentacja QA, art direction i specyfikacje.

## Assets

- Title key art: `public/assets/branding/title-key-art.png`
- 15 ilustracji openingu: `public/assets/intro/`
- Sprite Hubiego: `public/assets/characters/hubi-spritesheet.png`
- Fonty title screen: `src/assets/fonts/`
- Pozostałe obiekty gameplayowe są generowane lub renderowane przez bieżące moduły placeholderów opisane w `ASSET_MANIFEST.md`.

Assety są lokalne. Projekt nie pobiera grafik z tymczasowych ścieżek Codex ani zewnętrznych URL-i.

## Debug mode

W `npm run dev` narzędzia developerskie są włączone automatycznie:

- `F1` — panel test states,
- `F2` — showcase animacji Hubiego,
- `F3` — geometria stealth i stany AI.

Produkcja domyślnie nie zawiera aktywnych narzędzi debug. Opcjonalna zmienna `VITE_ENABLE_DEBUG=true` służy wyłącznie do świadomego przygotowania testowego buildu. Nie ustawiaj jej na produkcji.

## Save data

Zapis kampanii i rekord lokalny korzystają z `localStorage`. Projekt nie wymaga backendu ani bazy danych. Dane zapisu są lokalne dla przeglądarki i domeny.

## Environment variables

Gra nie wymaga sekretów, tokenów ani kluczy API. Jedyna obsługiwana zmienna jest opcjonalna i opisana w `.env.example`:

```text
VITE_ENABLE_DEBUG=false
```

## Deployment — Cloudflare Pages

Projekt jest statyczną aplikacją Vite/Phaser. Nie wymaga Workers, Pages Functions, D1 ani R2.

Ustawienia Cloudflare Pages:

- Framework preset: `Vite`
- Production branch: `main`
- Root directory: `/` (lub pozostaw puste, jeśli repozytorium wskazuje bezpośrednio ten katalog)
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: `22.13.0`
- Build environment variable: `NODE_VERSION=22.13.0`
- Zmienne aplikacyjne / sekrety: brak

Aktualna gra używa pojedynczego wejścia `index.html` i nie wymaga dodatkowej reguły SPA fallback.

## GitHub initialization

Po rozpakowaniu:

```bash
git init
git add .
git commit -m "Initial L4 Office Escape import"
```

Następnie utwórz puste repozytorium na GitHubie, dodaj je jako `origin` i wypchnij gałąź `main`.

## Controls

- `WASD` lub strzałki — ruch
- `SHIFT` — sprint
- `E` — interakcja
- `E` lub `SPACE` — pokaż cały tekst / przejdź dalej w dialogu
- `ESC` — pomiń opening
- `W/S` lub góra/dół — wybór odpowiedzi
- `1` — odbierz telefon
- `2` — odrzuć telefon
- `3` — tryb samolotowy

## Included documentation

- `PLAYTEST_CHECKLIST.md`
- `ART_DIRECTION.md`
- `ASSET_MANIFEST.md`
- `COVER_CONCEPT.md`
- `HUBI_SPRITE_SPEC.md`
- dokumentacja testowania w `docs/`

## Workspace export note

Wersja działająca w Codex Sites była osadzona w zewnętrznym wrapperze hostingowym. Wrapper, jego identyfikator `.openai/hosting.json` oraz skompilowana kopia `public/game/` nie są częścią runtime gry i zostały celowo pominięte. Zawartość katalogu `game-source/` została przeniesiona do korzenia tej paczki, dzięki czemu repozytorium wdraża się bez zależności od środowiska Codex.
