# Testowanie kampanii i podejrzliwości

## Sterowanie developerskie

Panel kampanii jest dostępny wyłącznie przez `npm run dev`.

- `F4` — pokaż lub ukryj panel kampanii.
- `Shift + 1..6` — ustaw miesiąc kampanii.
- `[` / `]` — odejmij lub dodaj jeden dzień L4; z `Shift` zmiana wynosi 10 dni.
- `-` / `+` — zmień podejrzliwość o 10 punktów.
- `0` — ustaw podejrzliwość na 0.
- `U` — zasymuluj ukończenie bieżącej misji bez wykrycia i upływ jej dni.
- `T` — zasymuluj trzy wykrycia przez kolegę w jednej misji.
- `N` — przejdź do pierwszego dnia następnego miesiąca.

Dotychczasowe skróty mieszkania pozostają pod `F6`, `F7` i `F8`.

## Scenariusze ręczne

1. Ustaw podejrzliwość na 0 i użyj `T`. Kolejne kary kolegi w miesiącu 1 powinny wynieść 5, 6 i 8 punktów.
2. Ustaw miesiąc 5, podejrzliwość 0 i sprowokuj pierwsze wykrycie. Kara powinna wynieść około 7 punktów.
3. Ustaw podejrzliwość 3 i użyj `U`. Wynik powinien zatrzymać się na 0.
4. Ustaw kolejno 40, 70 i 90 punktów. HUD powinien pokazać `SUSPICIOUS`, `HIGH_ALERT` i `CRITICAL`.
5. Ustaw dzień 30 i ukończ misję z dodatnim `daysPassed`. Po podsumowaniu powinien pojawić się ekran miesiąca 2, a gracz wrócić do mieszkania.
6. Dodaj PETG oraz uchwyt skrótami `F6` i `F7`, przejdź do kolejnego miesiąca i przeładuj stronę. Oba obiekty powinny pozostać widoczne.
7. Ustaw podejrzliwość na 100. Powinien pojawić się komunikat `FIRMA ŻĄDA WYJAŚNIEŃ`, a zapis zachować flagę maksymalnej podejrzliwości.
