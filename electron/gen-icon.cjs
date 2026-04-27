// Script: genera electron/icon.ico desde public/_preview.png
// Uso: node electron/gen-icon.cjs
const sharp = require('sharp');
const { default: pngToIco } = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../public/_preview.png');
const OUT = path.join(__dirname, 'icon.ico');
const SIZES = [16, 32, 48, 256];

async function main() {
  const pngs = [];
  for (const size of SIZES) {
    const buf = await sharp(SRC).resize(size, size).png().toBuffer();
    pngs.push(buf);
  }
  const ico = await pngToIco(pngs);
  fs.writeFileSync(OUT, ico);
  console.log(`✓ icon.ico generado (${(ico.length / 1024).toFixed(1)} KB) con tamaños: ${SIZES.join(', ')}px`);
}

main().catch(e => { console.error(e); process.exit(1); });
