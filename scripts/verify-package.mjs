import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const introFiles = [
  'intro-01-bylem-zwyklym-informatykiem.png',
  'intro-02-nie-mialem-wielkich-ambicji.png',
  'intro-03-komputer-kawa-kabel-restart-powtorz.png',
  'intro-04-praca-u-klienta.png',
  'intro-05-padalo-tak-jakby-miasto-probowalo-cos-zmyc.png',
  'intro-06-serwerownia-byla-przyjazna.png',
  'intro-07-lidka-sie-usmiechnela.png',
  'intro-08-w-szafie-wszystko-mialo-swoje-miejsce.png',
  'intro-09-popelnilem-fatalny-blad.png',
  'intro-10-faktycznie-zaczalem-cos-robic.png',
  'intro-11-klik.png',
  'intro-12-a-potem-zgaslo-wszystko.png',
  'intro-13-zostalem-sam-z-kablem-rj45.png',
  'intro-14-nie-pamietalem-od-czego-byl.png',
  'intro-15-tak-narodzila-sie-legenda-hubi-l4.png',
];

const requiredFiles = [
  'package.json',
  'package-lock.json',
  'index.html',
  'src/main.ts',
  'public/assets/branding/title-key-art.png',
  'public/assets/characters/hubi-spritesheet.png',
  'public/assets/characters/coworker-spritesheet.png',
  'public/assets/characters/hr-spritesheet.png',
  'public/assets/characters/manager-spritesheet.png',
  'src/assets/fonts/hubi-display-bold.ttf',
  'src/assets/fonts/hubi-tagline-serif.ttf',
  'src/assets/fonts/LICENSE-DejaVu.txt',
  ...introFiles.map((name) => `public/assets/intro/${name}`),
];

const missingFiles = requiredFiles.filter((file) => !existsSync(join(projectRoot, file)));
if (missingFiles.length > 0) {
  throw new Error(`Missing package files:\n${missingFiles.join('\n')}`);
}

const actualIntroFiles = readdirSync(join(projectRoot, 'public/assets/intro'))
  .filter((name) => name.endsWith('.png'))
  .sort();
if (actualIntroFiles.length !== 15 || actualIntroFiles.join('\n') !== introFiles.join('\n')) {
  throw new Error('Intro asset inventory does not match the expected 15-slide sequence.');
}

const forbiddenPathPatterns = [
  /\/workspace\//u,
  /\/tmp\//u,
  /sandbox:/u,
  /terminal\.local/u,
  /chatgpt\.site/u,
];
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.ts', '.txt']);

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'coverage', 'dist', 'node_modules'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

const workspaceReferences = [];
for (const file of walk(projectRoot)) {
  if (relative(projectRoot, file) === 'scripts/verify-package.mjs') continue;
  const extension = file.slice(file.lastIndexOf('.'));
  if (!textExtensions.has(extension) || statSync(file).size > 5_000_000) continue;
  const contents = readFileSync(file, 'utf8');
  if (forbiddenPathPatterns.some((pattern) => pattern.test(contents))) {
    workspaceReferences.push(relative(projectRoot, file));
  }
}

if (workspaceReferences.length > 0) {
  throw new Error(`Workspace-only references found:\n${workspaceReferences.join('\n')}`);
}

console.log('Package verified: required source files and all 15 intro assets are present.');
