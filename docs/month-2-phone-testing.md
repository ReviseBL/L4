# Testowanie miesiąca 2 i telefonu służbowego

## Wejście do miesiąca 2

Nowa gra rozpoczyna się w dniu 23. Trzy misje miesiąca 1 przesuwają kampanię odpowiednio o 2, 2 i 4 dni. Po misji z filamentem licznik osiąga dzień 31, pojawia się ekran „30 DNI ZA TOBĄ”, a po powrocie do mieszkania telefon zostaje odblokowany.

W development można użyć `K`, a następnie `J`, aby przejść bezpośrednio do misji „TYLKO JEDNO PYTANIE”.

## Sterowanie telefonu

- `1` — odbierz; rozmowa otwiera `DialogueBox`. `E` lub `SPACE` pokazuje cały tekst i przechodzi dalej. Ruch oraz interakcje są zablokowane, ale NPC nadal działa.
- `2` — odrzuć; centralny system podejrzliwości nalicza bazowo 3%.
- `3` — aktywuj tryb samolotowy na 30 sekund. Można go użyć raz na misję.

Brak reakcji przez czas dzwonienia tworzy missed call i bazowo 2% podejrzliwości. Wartości korzystają z mnożnika bieżącego miesiąca, lecz nie z eskalacji wykryć NPC.

## Debug telefonu (`K`)

- `P` — wymuś połączenie,
- `O` — zasymuluj odebranie,
- `M` — zasymuluj missed call,
- `R` — zresetuj wykorzystanie trybu samolotowego,
- `X` — włącz lub wyłącz PhoneSystem,
- `J` — przejdź do pierwszej misji miesiąca 2.

Panel pokazuje stan `DISABLED / IDLE / RINGING / ANSWERED / COOLDOWN / AIRPLANE_MODE` i liczbę połączeń w bieżącej misji.

## Misje

1. `TYLKO JEDNO PYTANIE` — kawa i jedno bezpieczne połączenie tutorialowe.
2. `PACZKA CZEKA` — automat paczkowy, zmieniona trasa patrolu i dwa połączenia, w tym jedno podczas powrotu.
3. `DYSZA 0,6 MM` — sklep 3D, 2–3 połączenia danych i instalacja trwałej części przy drukarce.

Po trzeciej misji kampania osiąga dzień 61 i pokazuje przejście do miesiąca 3, bez uruchamiania jego nowych mechanik.
