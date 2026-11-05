/*
  Heatmap focus analysis (runs in the browser, does not touch the backend).

  The backend returns the Grad-CAM heatmap as a JET-coloured PNG. This file
  converts each pixel colour back to an approximate 0-1 intensity so the UI
  can describe where the strongest highlight sits and warn when it hugs the
  image border (a common Grad-CAM artefact).

  If the image does not look like a JET colour map, analyzeHeatmap() returns
  null and the UI simply skips the extra hints.
*/

const SIZE = 96; // analysis resolution (px); keeps this fast
const LUT_SIZE = 128; // colour-map lookup entries
const HOT_THRESHOLD = 0.6; // intensity treated as "strongly activated"
const EDGE_MARGIN = 0.1; // outer 10% of each side counts as "near the edge"
const MAX_MEAN_COLOUR_DISTANCE = 30; // above this, it is not a JET map

const clamp01 = (x) => Math.min(1, Math.max(0, x));

const JET_LUT = Array.from({ length: LUT_SIZE }, (_, i) => {
  const v = i / (LUT_SIZE - 1);

  return [
    255 * clamp01(1.5 - Math.abs(4 * v - 3)),
    255 * clamp01(1.5 - Math.abs(4 * v - 2)),
    255 * clamp01(1.5 - Math.abs(4 * v - 1)),
  ];
});

const REGION_NAMES = [
  ["top left", "top", "top right"],
  ["left", "center", "right"],
  ["bottom left", "bottom", "bottom right"],
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Heatmap image could not be loaded"));
    image.src = src;
  });
}

/** 5x5 box blur so a single noisy pixel cannot decide the "peak". */
function blur(values, size, radius = 2) {
  const out = new Float32Array(values.length);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sum = 0;
      let count = 0;

      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            sum += values[ny * size + nx];
            count += 1;
          }
        }
      }

      out[y * size + x] = sum / count;
    }
  }

  return out;
}

/**
 * @param {string} src  data-URL of the heatmap image
 * @returns {Promise<null | {
 *   region: string | null,
 *   hotAreaPct: number,
 *   edgeShare: number,
 *   peakOnEdge: boolean,
 *   nearEdge: boolean
 * }>}
 */
export async function analyzeHeatmap(src) {
  const image = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) return null;

  context.drawImage(image, 0, 0, SIZE, SIZE);

  const { data } = context.getImageData(0, 0, SIZE, SIZE);

  const total = SIZE * SIZE;
  const values = new Float32Array(total);

  let distanceSum = 0;

  for (let p = 0; p < total; p += 1) {
    const r = data[p * 4];
    const g = data[p * 4 + 1];
    const b = data[p * 4 + 2];

    let bestIndex = 0;
    let bestDistance = Infinity;

    for (let k = 0; k < LUT_SIZE; k += 1) {
      const dr = r - JET_LUT[k][0];
      const dg = g - JET_LUT[k][1];
      const db = b - JET_LUT[k][2];
      const distance = dr * dr + dg * dg + db * db;

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = k;
      }
    }

    values[p] = bestIndex / (LUT_SIZE - 1);
    distanceSum += Math.sqrt(bestDistance);
  }

  if (distanceSum / total > MAX_MEAN_COLOUR_DISTANCE) {
    return null; // not a JET colour map, so don't guess
  }

  const margin = Math.round(SIZE * EDGE_MARGIN);

  const isEdge = (x, y) =>
    x < margin || y < margin || x >= SIZE - margin || y >= SIZE - margin;

  /* Share of strongly activated pixels, and how many sit near the border. */
  let hotCount = 0;
  let hotEdgeCount = 0;

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (values[y * SIZE + x] >= HOT_THRESHOLD) {
        hotCount += 1;
        if (isEdge(x, y)) hotEdgeCount += 1;
      }
    }
  }

  /* Location of the single strongest (smoothed) point. */
  const smooth = blur(values, SIZE);

  let peakIndex = 0;

  for (let p = 1; p < total; p += 1) {
    if (smooth[p] > smooth[peakIndex]) peakIndex = p;
  }

  const peakX = peakIndex % SIZE;
  const peakY = Math.floor(peakIndex / SIZE);

  const hasSignal = smooth[peakIndex] >= 0.5 && hotCount > 0;

  const column = peakX < SIZE / 3 ? 0 : peakX < (2 * SIZE) / 3 ? 1 : 2;
  const row = peakY < SIZE / 3 ? 0 : peakY < (2 * SIZE) / 3 ? 1 : 2;

  const edgeShare = hotCount > 0 ? hotEdgeCount / hotCount : 0;
  const peakOnEdge = hasSignal && isEdge(peakX, peakY);

  return {
    region: hasSignal ? REGION_NAMES[row][column] : null,
    hotAreaPct: (hotCount / total) * 100,
    edgeShare,
    peakOnEdge,
    nearEdge: hasSignal && (peakOnEdge || edgeShare >= 0.5),
  };
}
