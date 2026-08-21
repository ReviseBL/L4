# Testowanie DialogueSystem

## Sterowanie

- `E` lub `SPACE` podczas pisania — natychmiast pokaż pełną bieżącą stronę.
- kolejne `E` lub `SPACE` — przejdź dalej albo zakończ dialog.
- `W/S` lub strzałki góra/dół — zmień zaznaczoną odpowiedź.
- `E` — zatwierdź odpowiedź. Konsekwencję obsługuje system wywołujący dialog.

## Scenariusze ręczne

1. Rozpocznij nową grę. Intro misji pojawia się w dolnym panelu i nie znika bez akcji.
2. Naciśnij `E` w trakcie typewritera. Tekst powinien zostać natychmiast uzupełniony bez zmiany strony.
3. Naciśnij `E` ponownie. Powinna pojawić się następna kwestia lub nowy cel.
4. W misji z filamentem sprawdź drukarkę, kup PETG i wróć. Wszystkie ważne komunikaty powinny korzystać z jednego panelu.
5. W miesiącu 2 odbierz telefon. Panel połączenia znika, otwiera się `DialogueBox`, gracz jest nieruchomy, ale coworker nadal patroluje i może wykryć gracza.
6. Pozostaw dialog bez naciskania klawiszy. Nie powinien zamknąć się automatycznie.
7. Ukończ miesiąc. Ekran przejścia wymaga kliknięcia lub klawisza `E`.
8. Zmień rozmiar okna. Panel i zawinięty tekst powinny pozostać wewnątrz canvasa.

## Testy automatyczne

`tests/dialogue-system.test.ts` sprawdza typewriter, ręczne przechodzenie, brak automatycznego zamknięcia, kolejkę, wybory, callbacki i dzielenie długiego tekstu z polskimi znakami.
