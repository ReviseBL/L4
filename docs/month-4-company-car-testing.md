# Miesiąc 4 — samochód służbowy

## Szybki test

W buildzie developerskim otwórz `DEBUG`/`F1` i uruchom jeden z presetów:

- `COMPANY CAR BASIC` — przejazd po trasie,
- `COMPANY CAR DETECTION` — szybkie przejście przez `SUSPICIOUS`,
- `POSITION REPORTED` — reakcja coworkera i HR,
- `PHONE + CAR` — konflikt telefonu z przejazdem,
- `FULL MONTH 4 CHAOS` — M4-03 z kompletem zagrożeń.

Misje M4-01, M4-02 i M4-03 mają checkpointy wszystkich standardowych etapów. `RETURNING_HOME` automatycznie nadaje zakupy, dużą paczkę albo szpulę ASA.

## Reguły

- Auto porusza się tylko po danych tras drogowych i nie ściga gracza.
- Jedno rozpoznanie zgłasza jedno zdarzenie `companyCar` do `SuspicionSystem`.
- `PositionReportSystem` żyje 12 sekund, podaje NPC kontrolowane przybliżone cele i nie trafia do SaveGame.
- Duża paczka ogranicza sprint do 82% i blokuje dwie małe kryjówki.
- Stożek korzysta ze wspólnego `PerceptionSystem`, dlatego budynki i stan ukrycia blokują wykrycie.
