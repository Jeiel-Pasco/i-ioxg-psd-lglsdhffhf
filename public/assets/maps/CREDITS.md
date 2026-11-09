# Map Assets & Credits

## Local Vector Basemaps (`moon.svg`, `mars.svg`)

- `moon.svg` and `mars.svg` are original procedural SVG equirectangular basemaps created for *Still Out There* (`GDD.md` Section 4.2, Section 6.2).
- They render stylized lunar maria/craters and Martian basins/volcanoes underneath the 30-degree coordinate graticule with zero runtime third-party network requests.
- When `Reduce effects` is enabled in Settings (`html[data-effects='reduced']`), the SVG basemap layer is hidden so only the solid ground color and graticule remain.

## NASA / USGS Map Replacement (`tools/fetch-assets.ts`)

- To replace or supplement the vector basemaps with public-domain NASA LRO / MGS MOLA equirectangular maps at build time, run `npm run fetch:assets` and record the exact NASA/USGS source URL and credit here before shipping.

