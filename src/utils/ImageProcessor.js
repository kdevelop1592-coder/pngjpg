/**
 * Utility to process images and extract pixel data.
 */

export const processImage = (file, maxWidth = 64, depth = '24') => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize logic to keep the grid size manageable for education
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxWidth) {
                    const ratio = Math.min(maxWidth / width, maxWidth / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const imageData = ctx.getImageData(0, 0, width, height);
                const pixels = [];

                for (let i = 0; i < imageData.data.length; i += 4) {
                    let r = imageData.data[i];
                    let g = imageData.data[i + 1];
                    let b = imageData.data[i + 2];
                    let a = imageData.data[i + 3];

                    // Apply Color Quantization
                    if (depth === '1') {
                        // 1-bit Monochrome
                        const avg = (r + g + b) / 3;
                        const val = avg > 128 ? 255 : 0;
                        r = g = b = val;
                    } else if (depth === '4') {
                        // 4-bit CGA Palette
                        const c = quantizeTo4Bit(r, g, b);
                        r = c[0]; g = c[1]; b = c[2];
                    } else if (depth === '8') {
                        // 8-bit (3-3-2 RGB)
                        const c = quantizeTo8Bit(r, g, b);
                        r = c[0]; g = c[1]; b = c[2];
                    }
                    // 24-bit is default (no change)

                    pixels.push({
                        r, g, b, a,
                        hex: rgbToHex(r, g, b)
                    });
                }

                resolve({
                    url: event.target.result,
                    width,
                    height,
                    pixels
                });
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// --- Quantization Helpers ---

// Standard CGA 16-color palette
const CGA_PALETTE = [
    [0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170],
    [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
    [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255],
    [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]
];

function quantizeTo4Bit(r, g, b) {
    let minDist = Infinity;
    let closest = CGA_PALETTE[0];

    for (let color of CGA_PALETTE) {
        // Euclidean distance squared
        const dist = (r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2;
        if (dist < minDist) {
            minDist = dist;
            closest = color;
        }
    }
    return closest;
}

function quantizeTo8Bit(r, g, b) {
    // 3-3-2 mapping: R(3) G(3) B(2)
    // Map 0-255 to 0-7 (3 bits) or 0-3 (2 bits) then back to 0-255 for display

    // R: 3 bits -> 8 values (0, 36, 73, ..., 255)
    // Logic: round(val / 255 * 7) * (255/7)
    const r3 = Math.round(r / 255 * 7);
    const g3 = Math.round(g / 255 * 7);
    const b2 = Math.round(b / 255 * 3);

    return [
        Math.round(r3 * 255 / 7),
        Math.round(g3 * 255 / 7),
        Math.round(b2 * 255 / 3)
    ];
}
