/** Kitchen, home progression props, carried items and the phone frame (art round 4). */
export const PHONE_FRAME_TEXTURE = { key: 'ui-phone-frame', url: 'assets/ui/phone-frame.png', width: 172, height: 330 } as const;

export const KITCHEN_ART = {
  counter: { key: 'home-kitchen-counter', url: 'assets/home/kitchen-counter.png', width: 84, height: 64 },
  fridge: { key: 'home-kitchen-fridge', url: 'assets/home/kitchen-fridge.png', width: 31, height: 56 },
  cabinet: { key: 'home-kitchen-cabinet', url: 'assets/home/kitchen-cabinet.png', width: 60, height: 57 },
} as const;

const homeProp = (name: string) => ({ key: `home-${name}`, url: `assets/home/home-${name}.png` });
const carried = (name: string) => ({ key: `carry-${name}`, url: `assets/items/carry-${name}.png` });

export const HOME_PROP_TEXTURES = {
  pills: homeProp('pills'),
  milk: homeProp('milk'),
  coffee: homeProp('coffee'),
  groceryBag: homeProp('grocery-bag'),
  kebabWrapper: homeProp('kebab-wrapper'),
  usbCoil: homeProp('usb-coil'),
  spoolStack: homeProp('spool-stack'),
} as const;

export const CARRY_TEXTURES = {
  spoolTeal: carried('spool-teal'),
  spoolOrange: carried('spool-orange'),
  spoolBlack: carried('spool-black'),
  spoolPurple: carried('spool-purple'),
  spoolRed: carried('spool-red'),
  l4Box: carried('l4-box'),
  parcelSmall: carried('parcel-small'),
  parcelLarge: carried('parcel-large'),
  kebab: carried('kebab'),
  coffee: carried('coffee'),
  groceries: carried('groceries'),
} as const;

export const ROUND4_TEXTURES: readonly { key: string; url: string }[] = [
  PHONE_FRAME_TEXTURE,
  ...Object.values(KITCHEN_ART),
  ...Object.values(HOME_PROP_TEXTURES),
  ...Object.values(CARRY_TEXTURES),
];
