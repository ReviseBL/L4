# Testowanie trzech misji vertical slice

Uruchom `npm run dev`, wybierz `ROZPOCZNIJ L4` i opcjonalnie włącz debug AI klawiszem `F3`.

## Misja 1 — LEPIEJ NIE RYZYKOWAĆ

1. Wyjdź z mieszkania i przejdź do apteki w dolnej części mapy.
2. Podejdź do lady i użyj `[E] KUP LEKI`.
3. Sprawdź, czy `LEKI` pojawiły się w HUD w sekcji ekwipunku.
4. Wróć przez drzwi mieszkania.
5. Sprawdź ekran `MISJA WYKONANA`, czas, wykrycia i zmianę podejrzliwości.

## Misja 2 — TYLKO NA CHWILĘ

1. Rozpocznij kolejną misję z ekranu podsumowania.
2. Idź do minimarketu `CHWILKA`, unikając stożka kolegi z pracy.
3. Użyj `[E] KUP MLEKO` przy ladzie i sprawdź ekwipunek.
4. Wróć do mieszkania. Misja kończy się dopiero po ponownym wejściu do domu.
5. Sprawdź, czy bez wykrycia podsumowanie pokazuje `WYKRYCIA: 0` i zmianę podejrzliwości `0%`.
6. W dodatkowej próbie pozwól się zauważyć i potwierdź, że podsumowanie rejestruje wykrycie oraz `+5%`.

## Misja 3 — FILAMENT SIĘ SKOŃCZYŁ

1. Podejdź do drukarki w mieszkaniu i naciśnij `E`.
2. Sprawdź sekwencję `BEEP BEEP`, `FILAMENT: 0%`, `„Kurwa.”`.
3. Idź do oddalonego sklepu `3D PRINT SHOP` i użyj `[E] KUP FILAMENT`.
4. Potwierdź `SZPULA PETG` w ekwipunku oraz widoczne pudełko przy graczu.
5. Sprawdź, że sprint nadal działa, ale jest nieco wolniejszy.
6. Krzaki i samochód powinny odrzucić próbę ukrycia; kontener powinien nadal działać.
7. Wróć do drukarki i użyj `[E] ZAŁADUJ FILAMENT PETG`.
8. Sprawdź komunikaty o załadowaniu PETG, wydruku uchwytu do kabla i czasie `7h 42m`.
9. Drukarka powinna animować głowicę i pulsujące światło podczas podsumowania.

## Test automatyczny

`npm run test` przeprowadza dane wszystkich trzech misji w kolejności, sprawdza inventory, modyfikatory niesienia, drukarkę, podsumowania oraz istniejący system stealth.
