# Debug test states

Panel jest tworzony wyłącznie w trybie Vite `DEV` albo po jawnym ustawieniu `VITE_ENABLE_DEBUG=true`. Otwiera go `F1` albo mały przycisk `DEBUG`.

## Główny przepływ

1. Wybierz miesiąc, misję i etap przyciskami w pierwszym wierszu.
2. Ustaw dzień, podejrzliwość, telefon, coworkera, HR i preset mieszkania.
3. Kliknij `START TEST STATE`.

Scena uruchomi się ponownie z osobnym debugowym `GameState`. Zwykły zapis kampanii nie jest nadpisywany. `EXIT` usuwa aktywną sesję debug i wraca do normalnego zapisu.

## Etapy

- `MISSION_START` — początek wraz z intro.
- `AFTER_INTRO` — początek celu bez intro.
- `ON_ROUTE_TO_OBJECTIVE` — gracz na ulicy.
- `OBJECTIVE_READY` — gracz przy punkcie interakcji.
- `OBJECTIVE_COLLECTED` — następny objective i wymagany przedmiot w inventory.
- `RETURNING_HOME` — przedmiot w inventory, gracz przed drogą do mieszkania.
- `FINAL_INTERACTION_READY` — gracz przy końcowej interakcji lub przed obszarem domu.

## Gotowe scenariusze

- `HR BASIC PATROL`
- `HR DETECTION`
- `HR CONVERSATION`
- `PHONE + HR CONFLICT`
- `COWORKER + HR RETURN`

## Debug save

`SAVE SLOT 1/2` i `LOAD SLOT 1/2` używają osobnych kluczy `localStorage`. Aktywny test state również ma osobny klucz, dlatego przeładowanie strony odtwarza test bez wpływu na save kampanii.

## Build

- `npm run dev` — panel aktywny.
- `npm run build` — panel wyłączony.
- `VITE_ENABLE_DEBUG=true npm run build` — jawnie debugowy build do zamkniętego środowiska testowego.
