import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
    return Buffer.concat([len, typeB, data, crc]);
}

function createPng(size) {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(size, 0);
    ihdrData.writeUInt32BE(size, 4);
    ihdrData[8] = 8; ihdrData[9] = 2;
    const ihdr = makeChunk('IHDR', ihdrData);

    const rowSize = 1 + size * 3;
    const raw = Buffer.alloc(rowSize * size);
    for (let y = 0; y < size; y++) {
        const ro = y * rowSize;
        raw[ro] = 0;
        for (let x = 0; x < size; x++) {
            const px = ro + 1 + x * 3;
            const cx = (x / size - 0.5) * 2, cy = (y / size - 0.5) * 2;
            const f = Math.max(0, 1 - Math.sqrt(cx * cx + cy * cy) * 0.7);
            raw[px] = Math.round(124 * f + 15 * (1 - f));
            raw[px + 1] = Math.round(92 * f + 15 * (1 - f));
            raw[px + 2] = Math.round(252 * f + 26 * (1 - f));
        }
    }

    const idat = makeChunk('IDAT', zlib.deflateSync(raw));
    const iend = makeChunk('IEND', Buffer.alloc(0));
    return Buffer.concat([sig, ihdr, idat, iend]);
}

for (const size of [16, 48, 128]) {
    const png = createPng(size);
    fs.writeFileSync(`public/icons/icon${size}.png`, png);
    console.log(`icon${size}.png (${png.length} bytes)`);
}
