# L4: The Office Escape — Gameplay Beta QA

Data testu: __________  Tester: __________  Build: __________  Rozdzielczość: __________

## Zasady zgłaszania błędów

| Pole | Wartość |
|---|---|
| Bug | Krótki, jednoznaczny tytuł |
| Severity | BLOCKER / CRITICAL / MAJOR / MINOR / COSMETIC |
| Miesiąc i misja | Np. M4-02, RETURNING_HOME |
| Kroki reprodukcji | Numerowana lista od czystego lub wskazanego save'a |
| Oczekiwany rezultat | Co powinno się wydarzyć |
| Aktualny rezultat | Co wydarzyło się naprawdę |
| Powtarzalność | Zawsze / czasami / jeden raz |

## Start, sterowanie i wspólne systemy

- [ ] New Game usuwa poprzednią kampanię po potwierdzeniu.
- [ ] WASD i strzałki działają; ruch po skosie nie jest szybszy.
- [ ] SHIFT zwiększa prędkość, E uruchamia tylko najbliższą interakcję.
- [ ] Kolizje blokują gracza i NPC na ścianach oraz stałych obiektach.
- [ ] Kamera śledzi gracza i nie pokazuje obszaru poza mapą.
- [ ] HideSpot blokuje ruch, chroni przed każdym aktywnym zagrożeniem i pozwala wyjść E.
- [ ] DialogueBox: pierwsze E/SPACE odsłania tekst, kolejne przechodzi dalej.
- [ ] Wybory działają W/S i strzałkami, E zatwierdza.
- [ ] Telefon, warningi i HUD nie zasłaniają DialogueBox.

## Miesiąc 1

- [ ] M1-01 LEKI — zakup i powrót.
- [ ] M1-02 ŻABKA — mleko, coworker i powrót niezauważony.
- [ ] M1-03 FILAMENT — drukarka, PETG, ograniczony sprint, ukończony uchwyt.
- [ ] Coworker przechodzi PATROL → SUSPICIOUS → DETECTED → SEARCHING → PATROL.
- [ ] Przejście M1 → M2 następuje dokładnie raz.

## Miesiąc 2

- [ ] Telefon zostaje odblokowany i pojawia się tutorial.
- [ ] [1] odbiera i blokuje ruch, ale nie zatrzymuje świata.
- [ ] [2] odrzuca i dodaje skonfigurowaną podejrzliwość.
- [ ] Brak reakcji daje missed call.
- [ ] Airplane mode działa raz na misję i resetuje się w następnej.
- [ ] Cooldown nie pozwala na dwa połączenia jedno po drugim.
- [ ] M2-01 KAWA.
- [ ] M2-02 PACZKA.
- [ ] M2-03 DYSZA 0,6 MM; dysza pozostaje w mieszkaniu.
- [ ] Przejście M2 → M3 następuje dokładnie raz.

## Miesiąc 3

- [ ] M3-01 pierwsze spotkanie z HR i tutorial.
- [ ] HR: PATROL → SUSPICIOUS → APPROACHING → CONVERSATION.
- [ ] Ucieczka prowadzi HR do SEARCHING, a potem RETURNING.
- [ ] Wszystkie trzy odpowiedzi HR naliczają poprawne wartości.
- [ ] Wybór HR pozostaje po save/load.
- [ ] Telefon + HR nie tworzą dwóch DialogueBox jednocześnie.
- [ ] M3-02 USB-C; kabel pozostaje na biurku.
- [ ] M3-03 PLA; szpula pozostaje na półce.
- [ ] Przejście M3 → M4 następuje dokładnie raz.

## Miesiąc 4

- [ ] M4-01 tutorial samochodu.
- [ ] Samochód jedzie po waypointach i nie przecina budynków.
- [ ] Pole widzenia obraca się z autem i respektuje przeszkody.
- [ ] Jedno wykrycie nalicza jedną karę i zgłasza pozycję.
- [ ] Coworker i HR badają przybliżony obszar, bez teleportacji.
- [ ] Alert pozycji wygasa i nie wraca po reloadzie.
- [ ] M4-02 duża paczka ogranicza sprint i małe kryjówki.
- [ ] M4-03 ASA pozostaje w progresji domu.
- [ ] Przejście M4 → M5 następuje dokładnie raz.

## Miesiąc 5

- [ ] M5-01 tutorial kierownika.
- [ ] Manager: PATROL_AREA, INVESTIGATING, SUSPICIOUS, CHASE, SEARCHING, CHECKING_LOCATION, RETURNING.
- [ ] Manager zmienia zablokowany interest point zamiast campić przy przeszkodzie.
- [ ] Sprint pozwala zgubić managera; wejście za budynek zrywa line of sight.
- [ ] Zgłoszenie auta prowadzi managera do przybliżonego obszaru.
- [ ] M5-02: PLANNED → MATERIALS_READY → PRINTING.
- [ ] Filament L4 nie może zostać kupiony wielokrotnie.
- [ ] M5-03 kończy wydruk; duże L4 pozostaje po save/load.
- [ ] Przejście M5 → M6 następuje dokładnie raz.

## Miesiąc 6 i ZUS

- [ ] M6-01 TPU trafia na półkę.
- [ ] M6-02 jest możliwa bez wymuszonego wykrycia.
- [ ] Ostatnie podsumowanie prowadzi do dnia 179, nie do menu.
- [ ] Wiadomość ZUS przechodzi wyłącznie ręcznie.
- [ ] `ZusScene` nie pozostawia aktywnego telefonu ani NPC w tle.
- [ ] Dokumenty: poprawne i błędne wybory wpływają na credibility tylko raz.
- [ ] Pytania: wszystkie warianty, druk 3D i L4 400%.
- [ ] Walk test: chód jest bezpieczny, sprint obniża credibility.
- [ ] Analiza pokazuje zapisane statystyki kampanii.
- [ ] Ending A.
- [ ] Ending B.
- [ ] Ending C.
- [ ] Hidden Ending.
- [ ] L4 Score i ranga zapisują się; rekord lokalny pozostaje po nowej grze.

## Save/load stress test

- [ ] Reload w mieszkaniu.
- [ ] Reload przed odebraniem przedmiotu.
- [ ] Reload po odebraniu przedmiotu wznawia gracza poza domem.
- [ ] Reload w trakcie dzwonienia przywraca bezpieczny stan telefonu.
- [ ] Reload podczas CHASE/SEARCHING przywraca bezpieczny stan NPC.
- [ ] Reload pomiędzy miesiącami.
- [ ] Reload w dniu 179.
- [ ] Reload po każdym zakończeniu.
- [ ] Stary save v1–v5 migruje bez utraty kluczowej progresji.
- [ ] Uszkodzony save pokazuje komunikat i nie powoduje crasha.

## Debug i regresja techniczna

- [ ] Każdy jump M1–M6 uruchamia spójny miesiąc, dzień i systemy.
- [ ] Każda misja startuje na MISSION_START, OBJECTIVE_READY i RETURNING_HOME.
- [ ] Scenariusze HR, car, manager, phone conflict i ZUS działają.
- [ ] Quick save/load używa wyłącznie debugowych kluczy.
- [ ] Powrót do menu i zwykła Nowa gra czyszczą aktywny debug runtime.
- [ ] Produkcyjny build nie pokazuje panelu, hitboxów, stożków ani skrótów debug.
- [ ] Restart sceny nie duplikuje listenerów, colliderów ani timerów.

## Rozdzielczości desktopowe

- [ ] 1920×1080.
- [ ] 1440×900.
- [ ] 1366×768.
- [ ] HUD, telefon, summary i DialogueBox mieszczą się w viewport.

## Wynik pełnego przejścia

- [ ] Kampania ukończona od New Game do endingu bez debug jumpów.
- [ ] Brak BLOCKER/CRITICAL.
- [ ] Czas przejścia: __________
- [ ] Końcowa podejrzliwość: __________
- [ ] Ending / Score / Ranga: __________
- [ ] Uwagi do balansu: ________________________________________________
