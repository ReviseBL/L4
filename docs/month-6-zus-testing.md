# Miesiąc 6 i finał ZUS — testowanie

Finał jest fikcyjną, satyryczną mechaniką gry. Nie odwzorowuje rzeczywistych procedur ZUS ani kontroli świadczeń.

## Przepływ kampanii

- `M6-01 OSTATNIA SZPULA` startuje dnia 151 i przesuwa kampanię o 14 dni.
- `M6-02 TYLKO PO JEDZENIE` startuje dnia 165 i kończy się dnia 179.
- Po zamknięciu podsumowania M6-02 uruchamia się ręcznie przewijana wiadomość, dzień 180 i osobna `ZusScene`.
- `ZusScene` wyłącza standardowy HUD, telefon i wszystkie NPC świata osiedla.

## Fazy

1. `DOCUMENTS` — wybór trzech pozycji bez limitu czasu.
2. `QUESTIONS` — wybory obsługiwane przez `DialogueSystem`.
3. `WALK_TEST` — przejście od punktu A do B; sprint obniża credibility.
4. `ANALYSIS` — statystyki kampanii.
5. `VERDICT` — zakończenie zależne od credibility i kampanii.
6. `SUMMARY` — wynik, ranga, ponowna gra i menu.

## Debug scenarios

- `MONTH 6 BASIC`
- `DAY 179`
- `ZUS DOCUMENTS`
- `ZUS QUESTIONS`
- `ZUS WALK TEST`
- `ZUS VERDICT GOOD`
- `ZUS VERDICT BAD`
- `ZUS ENDING B`
- `ZUS HIDDEN ENDING`
- `FULL FINALE`

Scenariusze są dostępne wyłącznie przy włączonych narzędziach developerskich. Normalny build produkcyjny nie ładuje debug runtime i nie pokazuje panelu.
