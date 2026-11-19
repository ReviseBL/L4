import Phaser from 'phaser';
import type { ObstacleBounds, Point2D } from '../core/math/geometry-types';
import type { NpcPatrolSetup } from '../domain/npcs/npc-types';
import { homeVisualDefinitions } from '../data/home/home-progression';
import { worldInteractionTargets } from '../data/world/interaction-targets';
import { HomeProgressionView } from '../entities/interactables/home-progression-view';
import { Printer3DView } from '../entities/interactables/printer-3d-view';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../game/game-config';
import type { AreaDefinition } from '../systems/area-trigger-system';
import type { HideSpot } from '../systems/hiding-system';
import type { InteractionTarget } from '../systems/interaction-system';
import { WORLD_ART_PLACEMENTS, WORLD_TILE_TEXTURES, type WorldTileId } from '../data/world/world-art';

export interface TestWorld {
  obstacles: Phaser.Physics.Arcade.StaticGroup;
  occluders: readonly ObstacleBounds[];
  interactionTargets: readonly InteractionTarget[];
  hideSpots: readonly HideSpot[];
  areas: readonly AreaDefinition[];
  printerView: Printer3DView;
  homeProgressionView: HomeProgressionView;
  workColleaguePatrol: NpcPatrolSetup;
  workColleaguePatrolRoutes: Readonly<Record<string, readonly Point2D[]>>;
  hrPatrol: NpcPatrolSetup;
  hrPatrolRoutes: Readonly<Record<string, readonly Point2D[]>>;
  companyCarRoutes: Readonly<Record<string, readonly Point2D[]>>;
  managerSpawn: Point2D;
  playerSpawn: Phaser.Math.Vector2;
}

interface BuildingOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  floorColor: number;
  doorCenterX: number;
  doorSide?: 'top' | 'bottom';
  /** Kafel podłogi; bez tekstury zostaje jednolity floorColor. */
  floorTile?: WorldTileId;
  /** Grupa szyldu z world-art; gdy szyld się wyświetli, tekstowa etykieta budynku jest pomijana. */
  signGroup?: string;
}

export function createTestWorld(scene: Phaser.Scene): TestWorld {
  const obstacles = scene.physics.add.staticGroup();

  fillArea(scene, 'grass', WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x54794d);

  addRoads(scene);
  const printerView = addApartment(scene, obstacles);
  const homeProgressionView = new HomeProgressionView(scene, homeVisualDefinitions);
  addShop(scene, obstacles);
  addFilamentStore(scene, obstacles);
  addPharmacy(scene, obstacles);
  addBackgroundBuildings(scene, obstacles);
  addParking(scene, obstacles);
  addParcelLocker(scene, obstacles);
  addKebabStand(scene, obstacles);
  addStreetObstacles(scene, obstacles);
  placeArtGroup(scene, 'decals');
  placeArtGroup(scene, 'decor');
  const hideSpots = createHideSpots(scene);
  addWorldLabel(scene);

  const workColleagueRoute: readonly Point2D[] = [
    { x: 560, y: 655 },
    { x: 1980, y: 655 },
    { x: 1980, y: 815 },
    { x: 560, y: 815 },
  ];
  const workColleaguePatrolRoutes = {
    standard: workColleagueRoute,
    'parcel-loop': [
      { x: 560, y: 655 },
      { x: 1160, y: 655 },
      { x: 1320, y: 920 },
      { x: 1640, y: 920 },
      { x: 1980, y: 815 },
      { x: 1180, y: 815 },
    ],
    '3d-shop-loop': [
      { x: 980, y: 655 },
      { x: 1500, y: 655 },
      { x: 1980, y: 655 },
      { x: 1980, y: 895 },
      { x: 1430, y: 895 },
      { x: 1180, y: 735 },
    ],
  } as const satisfies Readonly<Record<string, readonly Point2D[]>>;
  const hrPatrolRoutes = {
    'pharmacy-loop': [
      { x: 520, y: 930 }, { x: 610, y: 1040 }, { x: 980, y: 1040 }, { x: 1040, y: 900 },
    ],
    'tech-loop': [
      { x: 1190, y: 900 }, { x: 1460, y: 890 }, { x: 1910, y: 840 }, { x: 1730, y: 650 }, { x: 1280, y: 650 },
    ],
    'filament-loop': [
      { x: 1120, y: 650 }, { x: 1450, y: 655 }, { x: 1880, y: 655 }, { x: 2010, y: 840 }, { x: 1590, y: 885 }, { x: 1250, y: 820 },
    ],
  } as const satisfies Readonly<Record<string, readonly Point2D[]>>;
  const companyCarRoutes = {
    'tutorial-road-loop': [
      { x: 1880, y: 700 }, { x: 1120, y: 700 }, { x: 500, y: 700 }, { x: 500, y: 790 }, { x: 1320, y: 790 }, { x: 2040, y: 790 },
    ],
    'parcel-road-loop': [
      { x: 2020, y: 790 }, { x: 1500, y: 790 }, { x: 1080, y: 790 }, { x: 500, y: 790 }, { x: 500, y: 700 }, { x: 1420, y: 700 },
    ],
    '3d-shop-road-loop': [
      { x: 520, y: 700 }, { x: 1180, y: 700 }, { x: 2020, y: 700 }, { x: 2020, y: 790 }, { x: 1420, y: 790 }, { x: 520, y: 790 },
    ],
  } as const satisfies Readonly<Record<string, readonly Point2D[]>>;

  return {
    obstacles,
    occluders: extractOccluders(obstacles),
    playerSpawn: new Phaser.Math.Vector2(285, 295),
    hideSpots,
    printerView,
    homeProgressionView,
    areas: [{ id: 'home', x: 285, y: 285, width: 360, height: 300 }],
    workColleaguePatrol: {
      spawn: { x: 560, y: 655 },
      route: workColleagueRoute,
    },
    workColleaguePatrolRoutes,
    hrPatrol: { spawn: { x: 520, y: 930 }, route: hrPatrolRoutes['pharmacy-loop'] },
    hrPatrolRoutes,
    companyCarRoutes,
    managerSpawn: { x: 1450, y: 895 },
    interactionTargets: worldInteractionTargets,
  };
}

function addKebabStand(scene: Phaser.Scene, obstacles: Phaser.Physics.Arcade.StaticGroup): void {
  if (placeArtGroup(scene, 'kebab-kiosk')) {
    placeArtGroup(scene, 'sign-kebab');
    // Budka z grafiką dostaje bryłę przy podstawie; lada (punkt interakcji) zostaje od strony chodnika.
    addInvisibleObstacle(obstacles, scene, 980, 995, 96, 40);
    return;
  }
  scene.add.rectangle(980, 970, 118, 74, 0x9d0208).setStrokeStyle(4, 0x370617).setDepth(970);
  scene.add.text(980, 970, 'KEBAB\nNA WYNOS', labelStyle(13)).setOrigin(0.5).setDepth(971);
}

function addParcelLocker(
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
): void {
  if (placeArtGroup(scene, 'parcel-locker')) {
    // Bryła dopasowana do grafiki automatu (92×90), żeby nie było niewidzialnej ściany nad nim.
    addInvisibleObstacle(obstacles, scene, 1320, 1005, 92, 90);
    return;
  }
  addSolidObstacle(scene, obstacles, 1320, 975, 92, 150, 0xe9c46a, 'AUTOMAT\nPACZKOWY');
  scene.add.rectangle(1320, 965, 58, 26, 0x264653).setDepth(977);
  scene.add.text(1320, 965, '24/7', labelStyle(10)).setOrigin(0.5).setDepth(978);
}

function createHideSpots(scene: Phaser.Scene): readonly HideSpot[] {
  const spots: readonly HideSpot[] = [
    { id: 'hedge-hide', x: 830, y: 530, radius: 72, label: 'KRZAKI' },
    { id: 'dumpster-hide', x: 1345, y: 555, radius: 72, label: 'KONTENER' },
    { id: 'parking-hide', x: 1815, y: 930, radius: 76, label: 'SAMOCHÓD' },
  ];

  placeArtGroup(scene, 'hide-hedge');
  // Znacznik kryjówki zawsze nad dekoracją (krzak), żeby był czytelny.
  const markerDepth = (spot: HideSpot): number => Math.round(spot.y + 60);
  for (const spot of spots) {
    scene.add
      .circle(spot.x, spot.y, 26, 0x00b4d8, 0.18)
      .setStrokeStyle(3, 0x8ecae6, 0.85)
      .setDepth(markerDepth(spot));
    scene.add
      .text(spot.x, spot.y, 'H', labelStyle(20))
      .setOrigin(0.5)
      .setDepth(markerDepth(spot) + 1);
    scene.add
      .text(spot.x, spot.y + 37, `HIDESPOT: ${spot.label}`, labelStyle(11))
      .setOrigin(0.5)
      .setDepth(markerDepth(spot) + 1);
  }

  return spots;
}

function extractOccluders(obstacles: Phaser.Physics.Arcade.StaticGroup): readonly ObstacleBounds[] {
  return obstacles.getChildren().map((child) => {
    const bounds = (child as Phaser.GameObjects.Rectangle).getBounds();

    return {
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      bottom: bounds.bottom,
    };
  });
}

function addRoads(scene: Phaser.Scene): void {
  fillArea(scene, 'asphalt', WORLD_WIDTH / 2, 735, WORLD_WIDTH, 240, 0x343a40);
  fillArea(scene, 'sidewalk', WORLD_WIDTH / 2, 575, WORLD_WIDTH, 80, 0xb7b0a3);
  fillArea(scene, 'sidewalk', WORLD_WIDTH / 2, 895, WORLD_WIDTH, 80, 0xb7b0a3);
  // Krawężniki oddzielające chodnik od jezdni.
  scene.add.rectangle(WORLD_WIDTH / 2, 615, WORLD_WIDTH, 4, 0x8d8a83);
  scene.add.rectangle(WORLD_WIDTH / 2, 855, WORLD_WIDTH, 4, 0x8d8a83);

  for (let x = 70; x < WORLD_WIDTH; x += 150) {
    scene.add.rectangle(x, 735, 82, 8, 0xe9c46a);
  }

  for (let x = 430; x <= 580; x += 30) {
    scene.add.rectangle(x, 735, 18, 175, 0xe7e5df);
  }
}

function addApartment(
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
): Printer3DView {
  addBuilding(scene, obstacles, {
    x: 285,
    y: 285,
    width: 430,
    height: 390,
    label: 'MIESZKANIE — BAZA L4',
    floorColor: 0xc9b79c,
    doorCenterX: 285,
    floorTile: 'apartment',
  });

  placeArtGroup(scene, 'apartment-wall-shelf');
  placeArtGroup(scene, 'apartment-doormat');
  addFurniture(scene, obstacles, 155, 200, 70, 45, 0x445e65, 'DRUKARKA\n3D', placeArtGroup(scene, 'apartment-printer'));
  addFurniture(scene, obstacles, 350, 205, 130, 62, 0x716969, 'KANAPA', placeArtGroup(scene, 'apartment-sofa'));
  addFurniture(scene, obstacles, 165, 365, 90, 55, 0x9c6644, 'BIURKO', placeArtGroup(scene, 'apartment-desk'));
  if (placeArtGroup(scene, 'apartment-filament-stack')) {
    scene.add.text(405, 446, '× 37', labelStyle(11)).setOrigin(0.5).setDepth(447);
  } else {
    scene.add.rectangle(405, 390, 75, 95, 0x90a955).setStrokeStyle(5, 0x31572c).setDepth(391);
    scene.add.text(405, 390, 'FILAMENT\n× 37', labelStyle(13)).setOrigin(0.5).setDepth(392);
  }
  return new Printer3DView(scene, 155, 200);
}

function addShop(scene: Phaser.Scene, obstacles: Phaser.Physics.Arcade.StaticGroup): void {
  addBuilding(scene, obstacles, {
    x: 970,
    y: 315,
    width: 360,
    height: 330,
    label: 'MINIMARKET „CHWILKA”',
    floorColor: 0x9bcf8c,
    doorCenterX: 970,
    floorTile: 'grocery',
    signGroup: 'sign-chwilka',
  });

  placeArtGroup(scene, 'chwilka-doormat');
  addFurniture(scene, obstacles, 950, 335, 180, 44, 0x33691e, 'LADA: KAWA / PĄCZKI', placeArtGroup(scene, 'chwilka-counter'));
  addFurniture(scene, obstacles, 1085, 210, 62, 110, 0xffca3a, 'CHIPSY', placeArtGroup(scene, 'chwilka-chips'));
}

function addFilamentStore(scene: Phaser.Scene, obstacles: Phaser.Physics.Arcade.StaticGroup): void {
  addBuilding(scene, obstacles, {
    x: 1630,
    y: 315,
    width: 430,
    height: 350,
    label: '3D PRINT SHOP',
    floorColor: 0x9bb8cd,
    doorCenterX: 1630,
    floorTile: 'grocery',
    signGroup: 'sign-3d-print-shop',
  });

  placeArtGroup(scene, 'print-shop-doormat');
  placeArtGroup(scene, 'sign-tech-shop');
  addFurniture(scene, obstacles, 1475, 290, 60, 150, 0xe76f51, 'PLA\nORANGE', placeArtGroup(scene, 'print-shop-pla-shelf'));
  addFurniture(scene, obstacles, 1630, 290, 60, 150, 0x2a9d8f, 'PETG', placeArtGroup(scene, 'print-shop-petg-shelf'));
  addFurniture(scene, obstacles, 1785, 290, 60, 150, 0x8338ec, 'TECH\nSHOP', placeArtGroup(scene, 'print-shop-tech-shelf'));
  if (placeArtGroup(scene, 'print-shop-l4-pallet')) {
    scene.add.text(1705, 438, 'L4 1,7 KG', labelStyle(10)).setOrigin(0.5).setDepth(439);
  } else {
    scene.add.rectangle(1705, 405, 90, 44, 0xe63946).setStrokeStyle(3, 0x252422).setDepth(406);
    scene.add.text(1705, 405, 'L4\n1,7 KG', labelStyle(10)).setOrigin(0.5).setDepth(407);
  }
  if (placeArtGroup(scene, 'print-shop-tpu')) {
    scene.add.text(1845, 438, 'TPU OSTATNIA', labelStyle(10)).setOrigin(0.5).setDepth(439);
  } else {
    scene.add.rectangle(1845, 405, 82, 44, 0x9d4edd).setStrokeStyle(3, 0x252422).setDepth(406);
    scene.add.text(1845, 405, 'TPU\nOSTATNIA', labelStyle(10)).setOrigin(0.5).setDepth(407);
  }
}

function addPharmacy(scene: Phaser.Scene, obstacles: Phaser.Physics.Arcade.StaticGroup): void {
  addBuilding(scene, obstacles, {
    x: 780,
    y: 1170,
    width: 360,
    height: 300,
    label: 'APTEKA „NA WSZELKI WYPADEK”',
    floorColor: 0xcde8d3,
    doorCenterX: 780,
    doorSide: 'top',
    floorTile: 'pharmacy',
    signGroup: 'sign-apteka',
  });

  placeArtGroup(scene, 'pharmacy-doormat');
  addFurniture(scene, obstacles, 780, 1170, 180, 44, 0x2a9d8f, 'LADA: LEKI', placeArtGroup(scene, 'pharmacy-counter'));
  addFurniture(scene, obstacles, 670, 1245, 55, 90, 0xf1faee, 'WIT. C', placeArtGroup(scene, 'pharmacy-vitamins'));
}

function addBackgroundBuildings(scene: Phaser.Scene, obstacles: Phaser.Physics.Arcade.StaticGroup): void {
  addSolidObstacle(scene, obstacles, 275, 1210, 430, 280, 0x7d8597, 'BLOK NR 23', placeArtGroup(scene, 'building-blok-23'));
  addSolidObstacle(scene, obstacles, 1280, 1215, 480, 250, 0x6c757d, 'BLOK NR 47', placeArtGroup(scene, 'building-blok-47'));
  addSolidObstacle(scene, obstacles, 1910, 1200, 420, 280, 0x8d99ae, 'BIUROWIEC — OMIJAĆ', placeArtGroup(scene, 'building-office'));
}

function addParking(scene: Phaser.Scene, obstacles: Phaser.Physics.Arcade.StaticGroup): void {
  fillArea(scene, 'parking', 1740, 1015, 700, 190, 0x4f5459);
  scene.add.rectangle(1740, 1015, 700, 190).setStrokeStyle(8, 0xc4c0b8);
  scene.add.text(1430, 940, 'PARKING', labelStyle(18)).setOrigin(0, 0.5);

  for (let x = 1480; x <= 2020; x += 135) {
    scene.add.rectangle(x, 1015, 4, 160, 0xd4d0c8);
  }

  const carArt = placeArtGroup(scene, 'parking-car');
  addCar(scene, obstacles, 1545, 1015, 0x457b9d, carArt);
  addCar(scene, obstacles, 1815, 1015, 0xc1121f, carArt);
  addCar(scene, obstacles, 2080, 1015, 0x606c38, carArt);
}

function addStreetObstacles(scene: Phaser.Scene, obstacles: Phaser.Physics.Arcade.StaticGroup): void {
  addSolidObstacle(scene, obstacles, 760, 550, 70, 46, 0x31572c, 'KRZAK', placeArtGroup(scene, 'street-hedge'));
  addSolidObstacle(scene, obstacles, 1270, 600, 84, 52, 0x495057, 'KONTENER', placeArtGroup(scene, 'street-dumpster'));
  const planterArt = placeArtGroup(scene, 'street-planter');
  addSolidObstacle(scene, obstacles, 1140, 875, 64, 64, 0x588157, 'DONICA', planterArt);
  addSolidObstacle(scene, obstacles, 215, 900, 64, 64, 0x588157, 'DONICA', planterArt);
}

function addBuilding(
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  options: BuildingOptions,
): void {
  const wall = 24;
  const doorWidth = 76;
  const left = options.x - options.width / 2;
  const right = options.x + options.width / 2;
  const top = options.y - options.height / 2;
  const bottom = options.y + options.height / 2;
  const leftDoorWidth = options.doorCenterX - doorWidth / 2 - left;
  const rightDoorWidth = right - (options.doorCenterX + doorWidth / 2);
  const doorSide = options.doorSide ?? 'bottom';

  if (options.floorTile && fillArea(scene, options.floorTile, options.x, options.y, options.width, options.height, options.floorColor)) {
    scene.add.rectangle(options.x, options.y, options.width, options.height).setStrokeStyle(5, 0x252422);
  } else {
    scene.add
      .rectangle(options.x, options.y, options.width, options.height, options.floorColor)
      .setStrokeStyle(5, 0x252422);
  }

  addWall(scene, obstacles, left, options.y, wall, options.height);
  addWall(scene, obstacles, right, options.y, wall, options.height);

  if (doorSide === 'bottom') {
    addWall(scene, obstacles, options.x, top, options.width, wall);
    addWall(scene, obstacles, left + leftDoorWidth / 2, bottom, leftDoorWidth, wall);
    addWall(
      scene,
      obstacles,
      options.doorCenterX + doorWidth / 2 + rightDoorWidth / 2,
      bottom,
      rightDoorWidth,
      wall,
    );
  } else {
    addWall(scene, obstacles, options.x, bottom, options.width, wall);
    addWall(scene, obstacles, left + leftDoorWidth / 2, top, leftDoorWidth, wall);
    addWall(
      scene,
      obstacles,
      options.doorCenterX + doorWidth / 2 + rightDoorWidth / 2,
      top,
      rightDoorWidth,
      wall,
    );
  }

  scene.add
    .rectangle(options.doorCenterX, doorSide === 'bottom' ? bottom - 3 : top + 3, doorWidth - 8, 12, 0xf4a261)
    .setDepth(Math.round(doorSide === 'bottom' ? bottom : top));
  if (options.signGroup && placeArtGroup(scene, options.signGroup)) return;
  scene.add
    .text(options.x, doorSide === 'bottom' ? top + 38 : bottom - 38, options.label, labelStyle(17))
    .setOrigin(0.5)
    .setDepth(Math.round(doorSide === 'bottom' ? top + 40 : bottom - 36));
}

function addWall(
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const wall = scene.add.rectangle(x, y, width, height, 0x3d405b).setStrokeStyle(3, 0x1d1f2c);
  obstacles.add(wall);
  wall.setDepth(Math.round(y));
}

function addFurniture(
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  label: string,
  artDrawn = false,
): void {
  const item = scene.add.rectangle(x, y, width, height, color).setStrokeStyle(3, 0x252422);
  obstacles.add(item);
  item.setDepth(Math.round(y));
  // Z grafiką prostokąt zostaje tylko jako niewidzialna bryła kolizji i przesłona widzenia.
  item.setVisible(!artDrawn);
  if (!artDrawn) scene.add.text(x, y, label, labelStyle(12)).setOrigin(0.5).setDepth(Math.round(y + 1));
}

function addSolidObstacle(
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  label: string,
  artDrawn = false,
): void {
  const obstacle = scene.add.rectangle(x, y, width, height, color).setStrokeStyle(4, 0x252422);
  obstacles.add(obstacle);
  obstacle.setDepth(Math.round(y));
  obstacle.setVisible(!artDrawn);
  if (!artDrawn) scene.add.text(x, y, label, labelStyle(13)).setOrigin(0.5).setDepth(Math.round(y + 1));
}

function addInvisibleObstacle(
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const obstacle = scene.add.rectangle(x, y, width, height, 0x000000).setVisible(false);
  obstacles.add(obstacle);
}

/** Wyświetla wszystkie grafiki danej grupy z world-art; false, gdy którejś tekstury brakuje. */
function placeArtGroup(scene: Phaser.Scene, group: string): boolean {
  const placements = WORLD_ART_PLACEMENTS.filter((placement) => placement.group === group);
  if (placements.length === 0 || !placements.every((placement) => scene.textures.exists(placement.key))) {
    return false;
  }
  for (const placement of placements) {
    const image = scene.add.image(placement.x, placement.y, placement.key).setDepth(placement.depth);
    if (placement.tint !== undefined) image.setTint(placement.tint);
    if (placement.flipX) image.setFlipX(true);
  }
  return true;
}

/** Wypełnia obszar kafelkiem; bez tekstury rysuje jednolity kolor. Zwraca true, gdy użyto kafla. */
function fillArea(
  scene: Phaser.Scene,
  tile: WorldTileId,
  x: number,
  y: number,
  width: number,
  height: number,
  fallbackColor: number,
): boolean {
  const texture = WORLD_TILE_TEXTURES[tile];
  if (scene.textures.exists(texture.key)) {
    scene.add.tileSprite(x, y, width, height, texture.key);
    return true;
  }
  scene.add.rectangle(x, y, width, height, fallbackColor);
  return false;
}

function addCar(
  scene: Phaser.Scene,
  obstacles: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  color: number,
  artDrawn = false,
): void {
  // Z grafiką auta stoją pionowo w miejscach parkingowych, więc bryła ma ich obrys (50×100).
  const car = artDrawn
    ? scene.add.rectangle(x, y - 15, 50, 100, color)
    : scene.add.rectangle(x, y, 105, 58, color).setStrokeStyle(4, 0x1b263b);
  obstacles.add(car);
  car.setDepth(Math.round(y));
  car.setVisible(!artDrawn);
  if (!artDrawn) scene.add.rectangle(x, y, 55, 38, 0x9bb1c8).setDepth(Math.round(y + 1));
}

function addWorldLabel(scene: Phaser.Scene): void {
  scene.add
    .text(38, WORLD_HEIGHT - 40, 'OSIEDLE „SPOKOJNY ETAT” — PROTOTYP MAPY', labelStyle(16))
    .setOrigin(0, 1);
}

function labelStyle(fontSize: number): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: 'Courier New, monospace',
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color: '#ffffff',
    align: 'center',
    stroke: '#1a1d21',
    strokeThickness: 3,
  };
}
