/**
 * Utility to process images and extract pixel data.
 */

export const processImage = (file, maxWidth = 32) => {
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
                    pixels.push({
                        r: imageData.data[i],
                        g: imageData.data[i + 1],
                        b: imageData.data[i + 2],
                        a: imageData.data[i + 3],
                        hex: rgbToHex(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2])
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
