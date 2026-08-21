# L4: The Office Escape — zasady rozwoju

## Cel dokumentu

Ten plik zawiera trwałe reguły obowiązujące wszystkie osoby i agentów rozwijających projekt. Zasady dotyczą całego repozytorium. W razie konfliktu pierwszeństwo mają bezpośrednie polecenia użytkownika.

## Kierunek produktu

- Gra jest humorystyczną, fikcyjną satyrą w stylistyce pixel art, z widokiem top-down i realiami polskiego blokowiska.
- Rdzeniem rozgrywki jest poruszanie się, sprint, skradanie, ukrywanie, unikanie stożków widzenia, proste zadania i bezpieczny powrót do mieszkania.
- Nie dodawaj walki ani realistycznej symulacji procedur medycznych, prawnych lub kontroli urzędowych.
- Pierwszym celem pozostaje dopracowany vertical slice. Sześciomiesięczna kampania istnieje jako warstwa danych i progresji; nowych przeciwników i finału ZUS nie implementuj bez osobnego zakresu.
- Powracający motyw bohatera to druk 3D, filament i absurdalne wydruki. Humor nie może pogarszać czytelności gameplayu.

## Stack i uruchamianie

- Używaj TypeScript, Phaser 3, Vite i npm.
- Nie dodawaj Reacta ani innego frameworka UI bez konkretnej, zaakceptowanej potrzeby.
- Interfejs związany z rozgrywką domyślnie renderuj w Phaserze. HTML/CSS stosuj tylko do elementów poza canvasem, gdy przynosi to wyraźną korzyść, np. dostępność lub formularze.
- Projekt musi budować się do samodzielnego katalogu `dist/` i działać jako statyczna strona, w tym na Cloudflare Pages.
- Gdy powstanie `package.json`, utrzymuj standardowe skrypty: `dev`, `build`, `preview`, `typecheck`, `lint` i `test`.
- Commituj `package-lock.json`. Nie zmieniaj głównych wersji zależności bez uzasadnienia i sprawdzenia migracji.
- Pozostań przy Phaser 3, dopóki użytkownik nie zaakceptuje migracji. Nie mieszaj API Phaser 3 i Phaser 4.

## Granice architektury

- Sceny Phaser są warstwą kompozycji i cyklu życia. Nie umieszczaj w nich reguł domenowych, dużych automatów stanów ani definicji misji.
- `WorldScene` koordynuje mapę i systemy świata; nie może stać się monolitem. `UIScene` działa równolegle i reaguje na jawne zdarzenia/stany.
- Logika domenowa ma być możliwie niezależna od Phaser API i testowalna bez renderera.
- Zależności przekazuj jawnie przez konstruktory lub fabryki. Nie wprowadzaj globalnego service locatora.
- Dopuszczalny jest jeden typowany kanał zdarzeń aplikacji. Nie twórz kilku niepowiązanych event busów ani zdarzeń opartych na przypadkowych stringach.
- Każdy listener, collider, timer i zasób tworzony przez scenę lub system musi być usunięty podczas `shutdown`/`destroy`. Restart sceny nie może podwajać subskrypcji.
- Nie twórz ogólnego ECS przed potwierdzeniem realnej potrzeby. Preferuj małe, wyspecjalizowane komponenty i systemy.

## Odpowiedzialności systemów

- `PlayerController`: wejście, ruch, sprint i interakcja; nie zarządza misjami ani podejrzliwością.
- `NPCController` i zachowania AI: wykonują jawny automat stanów. Pierwszy minimalny zestaw to `patrol`, `investigate`, `chase`, `search`, `return`.
- `PerceptionSystem`: oblicza zasięg, kąt widzenia, przesłonięcie i ekspozycję gracza. Zwraca fakty o wykryciu, ale nie zmienia podejrzliwości.
- `SuspicionSystem`: jest jedynym miejscem zmieniającym `SUSPICION` i zawsze ogranicza wartość do zakresu `0..100`.
- `MissionSystem`: interpretuje definicje danych, śledzi cele i reaguje na zdarzenia domenowe. Nie odpytuje konkretnych scen ani obiektów mapy po nazwie.
- `InteractionSystem`: rozstrzyga interakcje gracza z punktami, kryjówkami, wejściami i przedmiotami.
- `DialogueSystem`: ma osobny stan i model danych; dialog nie może być zaszywany w klasach NPC.
- Ważne dialogi, cele, przedmioty, komunikaty drukarki i rozmowy telefoniczne nie zamykają się automatycznie. Korzystają ze wspólnej kolejki `DialogueSystem`, a gracz przechodzi dalej świadomą akcją.
- `DialogueBox` wyłącznie renderuje snapshot dialogu. Konsekwencje wyborów i logika fabularna pozostają w systemach wywołujących dialog.
- `GameState`: przechowuje minimalny stan sesji/kampanii. Obiekty Phaser, sprite'y i referencje do scen nie mogą trafiać do stanu serializowalnego.
- `SaveService`: po dodaniu zapisów wersjonuje format i obsługuje migracje. Nie zapisuj danych na każdym ticku.
- `HomeProgressionSystem`: wyprowadza wizualny stan mieszkania z wersjonowanych danych kampanii. Sceny i widoki nie mogą sprawdzać numerów misji przez własne instrukcje warunkowe.
- `CampaignSystem`: jest jedynym miejscem wyliczającym dzień L4, bieżący miesiąc, ukończone miesiące i przejścia między miesiącami. Definicje sześciu miesięcy pozostają danymi.
- `PhoneSystem`: jest niezależnym od Phasera automatem połączeń służbowych. Misje definiują wyzwalacze i czasy w danych, a system zgłasza zdarzenia podejrzliwości zamiast naliczać punkty.
- `HrStateMachine` definiuje zachowanie `PATROL -> SUSPICIOUS -> APPROACHING -> CONVERSATION/SEARCHING -> RETURNING`; kontroler HR korzysta ze wspólnego `PerceptionSystem` i nie może duplikować geometrii widzenia.
- `ManagerStateMachine` definiuje aktywne szukanie przez `PATROL_AREA -> INVESTIGATING/SUSPICIOUS -> CHASE -> SEARCHING -> CHECKING_LOCATION -> RETURNING`. Misje przekazują wyłącznie dane `managerInterestPoints`; kierownik nie może odczytywać objective gracza.
- Krótkotrwałe stany kierownika (`CHASE`, `SEARCHING`, ostatnia znana pozycja) są stanem runtime i nie trafiają do SaveGame. Trwały zapis obejmuje jedynie odblokowanie mechaniki i progresję kampanii.
- `CompanyCarStateMachine` obsługuje wyłącznie `DRIVING -> SUSPICIOUS -> SPOTTED_PLAYER -> COOLDOWN`. Samochód jedzie po danych tras drogowych, nie ściga gracza i zgłasza jedno zdarzenie do `SuspicionSystem`.
- `PositionReportSystem` przechowuje krótkotrwałe zgłoszenie pozycji i przybliżone cele dochodzenia NPC. Tego stanu nie wolno serializować w SaveGame.
- `DebugTestStateSystem` buduje pełny, deterministyczny stan testowy z danych checkpointu. Nie dodawaj rozproszonych jumpów bezpośrednio w `GameScene`; nowe misje i scenariusze dopisuj do danych debug test states.
- `ZusFinaleSystem` jest czystą warstwą domenową odpowiedzialną za credibility, wpływ kampanii, wynik i wybór zakończenia. `ZusScene` renderuje fazy finału i nie może uruchamiać świata osiedla, PhoneSystem ani AI NPC w tle.
- Finał ZUS pozostaje fikcyjną satyrą. Nie zapisuj w dialogach ani mechanikach realnych porad prawnych, medycznych lub instrukcji dotyczących kontroli świadczeń.
- `AudioSystem`, `AchievementSystem` i `LeaderboardService` pozostają opcjonalnymi adapterami. Ranking wymaga późniejszego backendu; nie udawaj bezpiecznego rankingu przez sam `localStorage`.

## Dane i zawartość

- Misje, miesiące, NPC, dialogi, przedmioty, lokacje i parametry balansu definiuj jako dane, nie jako rozgałęzienia w scenach.
- Szpule, wydruki i dekoracje mieszkania odblokowuj przez typowane warunki w danych progresji. Stabilne identyfikatory wydruków i elementów domu są częścią formatu zapisu.
- Każda definicja danych ma stabilne, unikalne `id`, typ TypeScript oraz walidację przy ładowaniu. Błąd danych powinien wskazywać plik i pole.
- Identyfikatory w danych traktuj jak API: nie zmieniaj ich bez migracji zapisów i referencji.
- Mapy twórz w Tiled i eksportuj do formatu JSON obsługiwanego przez Phaser. Nazwy warstw i właściwości obiektów mapy dokumentuj w kodzie przez stałe lub typy.
- Mapa wskazuje semantyczne punkty, np. spawn, trasa patrolu, kryjówka, drzwi i cel misji; nie zawiera logiki misji.
- Parametry balansu trzymaj w jednym miejscu. Unikaj magicznych liczb w kontrolerach i scenach.

## Wykrywanie i AI

- Stożek widzenia musi uwzględniać dystans, kąt, przesłonięcie przez warstwę kolizji oraz czas ekspozycji. Sam kontakt z wielokątem nie oznacza natychmiastowego pełnego wykrycia.
- Do ruchu top-down i prostych kolizji używaj Arcade Physics. Raycast/line-of-sight implementuj jako odrębny moduł względem statycznej geometrii mapy.
- Logikę AI aktualizuj w kontrolowanym interwale, jeśli pełne obliczenia co klatkę nie są potrzebne. Nie alokuj nowych tablic ani obiektów w gorącej pętli bez potrzeby.
- Widoczny stożek jest informacją dla gracza i powinien odpowiadać rzeczywistej logice wykrywania.
- Kryjówka działa przez jawny stan gracza i regułę wejścia/wyjścia; nie przez wyłączanie całego sprite'a lub fizyki bez kontroli.
- Zachowania muszą być deterministyczne przy tym samym stanie wejściowym tam, gdzie to możliwe. Losowość wstrzykuj przez osobny generator, aby testy mogły używać stałego seeda.

## Podejrzliwość i misje

- Żaden NPC ani scena nie zapisuje `SUSPICION` bezpośrednio. Wysyłają zdarzenie z powodem, źródłem i wielkością, a `SuspicionSystem` stosuje reguły.
- NPC zgłasza wyłącznie typ źródła wykrycia. Bazowe punkty, mnożnik miesiąca, eskalacja kolejnych wykryć, progi firmy i premia stealth należą do centralnej konfiguracji `SuspicionSystem`.
- Nieodebrane i odrzucone połączenia są zwykłymi zdarzeniami `SuspicionSystem`, mają osobne wartości bazowe i nie korzystają z eskalacji kolejnych wykryć NPC.
- Wykrycie HR nalicza się raz przy wejściu w `APPROACHING`. Kary za odpowiedzi dialogowe są odrębnymi, centralnie skonfigurowanymi zdarzeniami i nie mogą być zaszyte w UI ani naliczone ponownie przy odtworzeniu dialogu.
- Trwałe wybory dialogowe mają stabilny identyfikator, są zapisywane w `GameState` i domyślnie nie nadpisują wcześniejszej odpowiedzi. Kolejka `DialogueSystem` rozstrzyga konflikty telefonu i rozmowy HR.
- Aktywnego dzwonienia ani rozmowy nie zapisuj. SaveGame przechowuje tylko odblokowanie telefonu i łączne statystyki, aby reload zawsze odtwarzał bezpieczny stan `IDLE`.
- Debug runtime i quick-save sloty muszą używać osobnych kluczy storage. Aktywna sesja debug nie może zapisywać się pod normalnym kluczem kampanii, a production build bez jawnej flagi nie może tworzyć panelu debug.
- Każda misja deklaruje `daysPassed`; zakończenie misji przesuwa kampanię przez `CampaignSystem`. Nie zmieniaj dnia ani miesiąca bezpośrednio w scenie.
- Zmiana podejrzliwości powinna być czytelna dla gracza: pasek, krótka informacja o przyczynie i spójna reakcja audio/wizualna.
- Misja składa się z warunków startu, kroków/celów, warunków ukończenia lub porażki i nagród/efektów. Kroki używają wspieranych typów celów zamiast dowolnego kodu w danych.
- Pierwsze typy celów utrzymuj małe: `goTo`, `interact`, `collect`, `returnHome`, `remainUnseen`.
- Postęp misji wynika ze zdarzeń domenowych, np. `area:entered`, `item:collected`, `npc:detected-player`, a nie z pętli sprawdzającej konkretne obiekty każdej klatki.

## Konwencje kodu

- Preferuj małe moduły z jedną odpowiedzialnością, ścisły TypeScript i brak `any`. Jeśli typ zewnętrzny wymusza wyjątek, udokumentuj go lokalnie.
- Nazwy plików modułów zapisuj w `kebab-case`, klasy i typy w `PascalCase`, funkcje i zmienne w `camelCase`, stałe tylko do wartości rzeczywiście stałych.
- Eksportuj publiczne API folderu przez ostrożnie używane `index.ts`; unikaj cyklicznych zależności i wielkich barrel files.
- Nie importuj z warstwy prezentacji do domeny. Dopuszczalny kierunek to `scenes/presentation -> application/systems -> domain`.
- Komentarze wyjaśniają decyzje i nietypowe ograniczenia, nie powtarzają oczywistego kodu.
- Nie dodawaj abstrakcji „na przyszłość” bez co najmniej drugiego realnego przypadku użycia, z wyjątkiem uzgodnionych granic systemów w tym dokumencie.

## Testy i jakość

- Testy jednostkowe są obowiązkowe dla: ograniczania podejrzliwości, przejść stanów AI, geometrii pola widzenia, progresji misji i walidacji danych.
- Dla pierwszego vertical slice dodaj co najmniej jeden test integracyjny przepływu: start misji -> zebranie celu -> wykrycie lub uniknięcie NPC -> powrót -> zakończenie.
- Po każdej zmianie uruchom adekwatny zestaw: `typecheck`, `lint`, `test` i `build`. Nie deklaruj ukończenia przy znanych błędach.
- Zmiany formatu zapisu wymagają zwiększenia `SAVE_FORMAT_VERSION`, migracji oraz testu odczytu poprzedniego formatu. Zapisuj po zdarzeniach domenowych i ukończeniu efektów, nigdy w pętli `update`.
- Zmiany gameplayowe weryfikuj także ręcznie w przeglądarce: restart sceny, utrata fokusu, zmiana rozmiaru okna, pełny przebieg misji i wejście/wyjście z kryjówki.
- Dodawaj tryb debugowania dostępny tylko w development: geometria kolizji, rzeczywisty stożek widzenia, stan AI, bieżący cel misji i źródła zmian podejrzliwości.

## Grafika, kamera i UX

- Ustal jedną bazową rozdzielczość i skalę pixel art przed produkcją assetów. Używaj nearest-neighbor, całkowitych skal i unikaj subpikselowego rozmycia kamery/sprite'ów.
- Zachowuj spójną siatkę tile'i, proporcje postaci, kierunki animacji i paletę. Źródła assetów trzymaj oddzielnie od plików eksportowanych do gry.
- Gameplayowe sygnały mają pierwszeństwo przed dekoracją: gracz, NPC, stożki widzenia, kryjówki, cele i alerty muszą być rozpoznawalne bez zgadywania.
- Sterowanie musi wspierać klawiaturę; nie opieraj informacji wyłącznie na kolorze. Dodaj możliwość wyciszenia i ograniczenia intensywnych efektów/migania, gdy takie efekty powstaną.
- UI powinno poprawnie reagować na popularne proporcje ekranu. Świat gry nie może odsłaniać obszaru poza mapą przy zmianie rozmiaru.

## Assety i prawa

- Nie kopiuj grafik, map, muzyki, nazw ani interfejsów z GTA, Hotline Miami lub innych gier. Inspiracja dotyczy ogólnego nastroju i gatunku.
- Każdy zewnętrzny asset musi mieć znane źródło i licencję pozwalającą na użycie; prowadź rejestr w `docs/assets.md` lub metadanych assetu.
- Nazwy marek i instytucji zastępuj fikcyjnymi, jeśli użycie prawdziwej nazwy nie jest świadomą decyzją użytkownika. Vertical slice powinien używać fikcyjnego sklepu.

## Git i zakres zmian

- Przed edycją sprawdź stan repozytorium. Nie nadpisuj ani nie usuwaj zmian użytkownika niezwiązanych z zadaniem.
- Commity powinny być małe i tematyczne. Nie łącz refaktoru, assetów i nowej mechaniki w jeden nieczytelny commit.
- Nie dodawaj nowych mechanik miesięcy, fabularnych przeciwników, backendu rankingu ani rozbudowanego systemu dialogowego bez osobnego zakresu. Rozwijaj istniejący szkielet kampanii przy zachowaniu kompatybilności zapisu.
- Nową zależność dodawaj tylko, jeśli ogranicza realną złożoność; opisz jej przeznaczenie i wpływ na rozmiar bundla.

## Definicja ukończenia pierwszego vertical slice

Vertical slice jest gotowy dopiero, gdy:

1. Gracz może rozpocząć w mieszkaniu, wyjść na fragment osiedla i wrócić.
2. Działa fikcyjny mały sklep, sklep z filamentem oraz 2–3 misje zdefiniowane w danych.
3. Jeden kolega z pracy patroluje, wykrywa gracza zgodnie z widocznym polem widzenia, ściga, szuka i wraca do patrolu.
4. Sprint, punkty ukrycia i pasek `SUSPICION 0..100` tworzą kompletną pętlę skradania.
5. Restart sceny nie duplikuje listenerów, timerów ani colliderów.
6. Krytyczna logika ma testy, a `typecheck`, `lint`, `test` i `build` przechodzą.
7. Produkcyjny build `dist/` działa po statycznym hostowaniu i bez zależności od serwera aplikacyjnego.
