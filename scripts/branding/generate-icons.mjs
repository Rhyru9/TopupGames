import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

// Build browser/PWA formats from the supplied logo; keep its original artwork.
const source = 'public/brand/r9host-logo.png';
const symbol = sharp(source).extract({ left: 70, top: 105, width: 880, height: 510 });
for (const size of [32, 180, 192, 512]) {
  await symbol.clone().resize(size, size, { fit: 'contain', background: '#050505' })
    .png().toFile(`public/brand/r9host-icon-${size}.png`);
}
const sizes = [16, 32, 48, 64];
const images = await Promise.all(sizes.map(size => symbol.clone()
  .resize(size, size, { fit: 'contain', background: '#050505' }).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((png, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
const ico = Buffer.concat([header, ...images]);
await writeFile('app/favicon.ico', ico);
// Compatibility for previously saved settings and direct browser requests.
await writeFile('public/pavicon.ico', ico);
await sharp(source).resize(1080, 500, { fit: 'contain', background: '#050505' })
  .extend({ top: 65, bottom: 65, left: 60, right: 60, background: '#050505' })
  .jpeg({ quality: 90 }).toFile('public/brand/r9host-og.jpg');
