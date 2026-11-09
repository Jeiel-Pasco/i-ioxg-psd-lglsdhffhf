// Build-time NASA asset fetcher (GDD 5.6, 12.4, 12.6).
// Never runs at runtime in the browser. Checks local basemaps and downloads
// verified NASA Image and Video Library images into `public/assets/images/`
// when `image.nasa_id` and `image.src` are populated by human researchers.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadEntryFiles } from './validate-data';

const DATA_DIR = 'data/artifacts';
const PUBLIC_DIR = 'public';
const MAPS = ['public/assets/maps/moon.svg', 'public/assets/maps/mars.svg'];

interface NasaAssetManifest {
  collection?: {
    items?: { href?: string }[];
  };
}

function isPlaceholder(val: unknown): boolean {
  return typeof val !== 'string' || val.trim() === '' || val.trim() === 'TODO';
}

async function fetchNasaImage(nasaId: string, destRelPath: string): Promise<boolean> {
  const destPath = join(PUBLIC_DIR, destRelPath.replace(/^\//, ''));
  if (existsSync(destPath)) return true;

  const assetUrl = `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`;
  const res = await fetch(assetUrl);
  if (!res.ok) {
    console.error(`Failed to query NASA asset API for ${nasaId}: HTTP ${res.status}`);
    return false;
  }

  const data = (await res.json()) as NasaAssetManifest;
  const items = data.collection?.items ?? [];
  const imageHref = items
    .map((i) => i.href ?? '')
    .find((href) => /\~medium\.(jpg|jpeg|png)$/i.test(href) || /\~small\.(jpg|jpeg|png)$/i.test(href) || /\.(jpg|jpeg|png)$/i.test(href));

  if (!imageHref) {
    console.error(`No downloadable image found in NASA manifest for ${nasaId}`);
    return false;
  }

  const imgRes = await fetch(imageHref);
  if (!imgRes.ok) {
    console.error(`Failed to download image ${imageHref}: HTTP ${imgRes.status}`);
    return false;
  }

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, buffer);
  console.log(`Downloaded ${nasaId} -> ${destPath} (${buffer.byteLength} bytes)`);
  return true;
}

export async function runFetchAssets(args: string[]): Promise<number> {
  const checkOnly = args.includes('--check');
  let missingMaps = 0;
  for (const mapPath of MAPS) {
    if (!existsSync(mapPath)) {
      console.error(`Missing local map asset: ${mapPath}`);
      missingMaps++;
    }
  }

  const entries = loadEntryFiles(DATA_DIR);
  let pending = 0;
  let ready = 0;
  let failed = 0;

  for (const entry of entries) {
    const image = typeof entry.image === 'object' && entry.image !== null ? (entry.image as Record<string, unknown>) : {};
    const nasaId = image.nasa_id;
    const src = image.src;

    if (isPlaceholder(nasaId) || isPlaceholder(src)) {
      pending++;
      continue;
    }

    ready++;
    if (!checkOnly) {
      const ok = await fetchNasaImage(String(nasaId), String(src));
      if (!ok) failed++;
    }
  }

  console.log(
    `Maps: ${MAPS.length - missingMaps}/${MAPS.length} present · Entry images: ${ready} specified, ${pending} pending TODO, ${failed} failed`,
  );
  return missingMaps > 0 || failed > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFetchAssets(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
