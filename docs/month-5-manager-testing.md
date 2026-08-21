# Miesiąc 5 — kierownik i projekt L4 400%

## Szybki start

W buildzie developerskim otwórz panel klawiszem `F1`, wybierz miesiąc 5 albo jeden z presetów i uruchom `RUN SCENARIO`.

## Presety

- `MANAGER BASIC` — przechodzenie między punktami zainteresowania.
- `MANAGER DETECTION` — szybkie przejście `SUSPICIOUS -> CHASE`.
- `MANAGER CHASE` — pełne wykrycie i pojedyncza kara podejrzliwości.
- `MANAGER SEARCHING` — ostatnia znana pozycja i lokalne punkty sprawdzania.
- `CAR REPORT + MANAGER` — raport samochodu uruchamia `INVESTIGATING`.
- `L4 PRINT RETURN` — powrót z `l4-print-filament`, ograniczony sprint i zablokowane małe kryjówki.
- `MONTH 5 FULL CHAOS` — coworker, HR, kierownik, samochód i telefon.

## Projekt L4

M5-02 prowadzi przez `PLANNED`, `MATERIALS_READY` i `PRINTING`. Intro M5-03 kończy wydruk i ustawia `COMPLETED`. Przyciski `ADD L4 FIL`, `L4 PRINTING` i `L4 DONE` pozwalają testować etapy bez przechodzenia misji.

## Oczekiwane zachowanie

- Kierownik nie zna dokładnego celu ani pozycji gracza bez obserwacji, raportu auta lub rzadkiego sygnału przy `CRITICAL`.
- Sprint gracza pozostaje szybszy od `CHASE` kierownika.
- Budynki blokują percepcję, a wejście do kryjówki nie kasuje zapamiętanej wcześniej pozycji.
- Reload czyści runtime AI, ale zachowuje stan projektu `l4-400` i ukończony placeholder w mieszkaniu.
