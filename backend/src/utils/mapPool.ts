/**
 * CS2 Active Map Pool
 */
export const CS2_MAP_POOL = [
  'Ancient',
  'Dust2',
  'Inferno',
  'Mirage',
  'Nuke',
  'Overpass',
  'Train'
] as const;

export type CS2Map = typeof CS2_MAP_POOL[number];

/**
 * Random map választás az aktív poolból
 */
export function getRandomMap(): string {
  const randomIndex = Math.floor(Math.random() * CS2_MAP_POOL.length);
  return CS2_MAP_POOL[randomIndex];
}
