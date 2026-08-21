# Testowanie pierwszego systemu stealth

Uruchom grę przez `npm run dev`, rozpocznij L4 i użyj `F3`, aby włączyć lub wyłączyć debug. Debug pokazuje hitboxy, promienie stożka, stan AI i ostatnią znaną pozycję gracza.

## PATROL

Pozostań w mieszkaniu albo poza stożkiem. Kolega powinien poruszać się po prostokątnej trasie na jezdni. Debug pokazuje `AI: PATROL`.

## SUSPICIOUS

Wejdź na moment w boczną krawędź stożka i natychmiast się cofnij. Nad NPC pojawi się `?`, a debug pokaże `SUSPICIOUS`. Jeśli gracz nie zostanie ponownie zauważony, NPC wróci do `PATROL`.

## DETECTED

Stań wyraźnie w środkowej części stożka przez około sekundę. Nad NPC pojawi się `!`, pokaże się komunikat „KOLEGA Z PRACY CIĘ ZAUWAŻYŁ”, a podejrzliwość wzrośnie dokładnie o 5%. NPC ruszy do ostatniej znanej pozycji.

Pozostań w stożku kilka sekund. Podejrzliwość nie powinna rosnąć co klatkę ani przy ciągłym kontakcie.

## SEARCHING

Po wykryciu schowaj się za ścianą albo wejdź do HideSpot. Po utracie widoczności NPC dojdzie do ostatniej znanej pozycji i przez kilka sekund będzie jej szukać. Debug pokaże krzyżyk ostatniej pozycji oraz `SEARCHING`.

## RETURNING i powrót do PATROL

Nie pokazuj się podczas wyszukiwania. Po około 4,5 sekundy debug pokaże `RETURNING`. NPC wróci do trasy, a następnie przejdzie do `PATROL`.

## Przesłanianie przez ściany

Stań w mieszkaniu lub sklepie, mając NPC po drugiej stronie pełnej ściany. Promienie i wypełnienie stożka powinny kończyć się na ścianie, a AI nie powinno reagować. Otwarte drzwi pozostają rzeczywistą luką w osłonie.

## HideSpot

Podejdź do jednego z trzech niebieskich znaczników `HIDESPOT`: krzaków, kontenera lub samochodu. Po pojawieniu się `[E] SCHOWAJ SIĘ` naciśnij `E`. Gracz stanie się półprzezroczysty, ruch zostanie zablokowany, a NPC nie będzie mógł go wykryć. Ponowne `E` przywróci ruch.

## Sprint

Porównaj zasięg reakcji NPC podczas chodzenia i sprintu. Sprint jest szybszy oraz zwiększa efektywny zasięg percepcji o 18%, bez systemu staminy.
