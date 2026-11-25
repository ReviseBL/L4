export const GAME_BRAND = {
  title: 'L4: The Office Escape',
  tagline: 'The story of Herbert “Herbi L4”',
} as const;

export const TITLE_KEY_ART = {
  key: 'branding/title-key-art',
  url: 'assets/branding/title-key-art.png',
  available:
    typeof __TITLE_KEY_ART_AVAILABLE__ !== 'undefined' && __TITLE_KEY_ART_AVAILABLE__,
  focalPoint: { x: 0.72, y: 0.48 },
} as const;

export const OPENING_ART_ASSETS = [
  {
    key: 'opening/intro-01',
    url: 'assets/intro/intro-01-bylem-zwyklym-informatykiem.png',
  },
  {
    key: 'opening/intro-02',
    url: 'assets/intro/intro-02-nie-mialem-wielkich-ambicji.png',
  },
  {
    key: 'opening/intro-03',
    url: 'assets/intro/intro-03-komputer-kawa-kabel-restart-powtorz.png',
  },
  {
    key: 'opening/intro-04',
    url: 'assets/intro/intro-04-praca-u-klienta.png',
  },
  {
    key: 'opening/intro-05',
    url: 'assets/intro/intro-05-padalo-tak-jakby-miasto-probowalo-cos-zmyc.png',
  },
  {
    key: 'opening/intro-06',
    url: 'assets/intro/intro-06-serwerownia-byla-przyjazna.png',
  },
  {
    key: 'opening/intro-07',
    url: 'assets/intro/intro-07-lidka-sie-usmiechnela.png',
  },
  {
    key: 'opening/intro-08',
    url: 'assets/intro/intro-08-w-szafie-wszystko-mialo-swoje-miejsce.png',
  },
  {
    key: 'opening/intro-09',
    url: 'assets/intro/intro-09-popelnilem-fatalny-blad.png',
  },
  {
    key: 'opening/intro-10',
    url: 'assets/intro/intro-10-faktycznie-zaczalem-cos-robic.png',
  },
  {
    key: 'opening/intro-11',
    url: 'assets/intro/intro-11-klik.png',
  },
  {
    key: 'opening/intro-12',
    url: 'assets/intro/intro-12-a-potem-zgaslo-wszystko.png',
  },
  {
    key: 'opening/intro-13',
    url: 'assets/intro/intro-13-zostalem-sam-z-kablem-rj45.png',
  },
  {
    key: 'opening/intro-14',
    url: 'assets/intro/intro-14-nie-pamietalem-od-czego-byl.png',
  },
  {
    key: 'opening/intro-15',
    url: 'assets/intro/intro-15-tak-narodzila-sie-legenda-hubi-l4.png',
  },
] as const;
