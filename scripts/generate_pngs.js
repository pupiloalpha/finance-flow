import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, getPixel) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }

  function chunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = crc32(typeAndData);
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderFinanceIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  // Deep emerald gradient background (#0f172a to #064e3b)
  let r = Math.round(15 + (6 - 15) * (nx * 0.5 + ny * 0.5));
  let g = Math.round(23 + (78 - 23) * (nx * 0.5 + ny * 0.5));
  let b = Math.round(42 + (59 - 42) * (nx * 0.5 + ny * 0.5));
  let a = 255;

  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

  // Outer circular glow
  if (dist > w * 0.38 && dist < w * 0.40) {
    r = 16; g = 185; b = 129;
  }
  // Trend line drawing
  const lineY = h * 0.7 - Math.sin(nx * Math.PI) * (h * 0.35);
  if (Math.abs(y - lineY) < h * 0.028) {
    r = 52; g = 211; b = 153;
  }

  // Centered emblem
  if (Math.abs(x - cx) < w * 0.18 && Math.abs(y - cy) < h * 0.18) {
    if (Math.abs(x - cx) > w * 0.16 || Math.abs(y - cy) > h * 0.16) {
      r = 52; g = 211; b = 153;
    }
  }

  return [r, g, b, a];
}

const p192 = createPng(192, 192, renderFinanceIcon);
const p512 = createPng(512, 512, renderFinanceIcon);
const pApple = createPng(180, 180, renderFinanceIcon);

fs.writeFileSync('public/pwa-192x192.png', p192);
fs.writeFileSync('public/pwa-512x512.png', p512);
fs.writeFileSync('public/pwa-maskable-512x512.png', p512);
fs.writeFileSync('public/apple-touch-icon.png', pApple);
console.log('PNG icons created successfully');
