
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const ffmpeg = require('fluent-ffmpeg');

const processFrame = async (framePath) => {
    const image = await Jimp.read(framePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    const gridSize = 3; // 3x3 grid
    const blockWidth = Math.floor(width / gridSize);
    const blockHeight = Math.floor(height / gridSize);

    let centralBlockParity = 0;
    const key = [];

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const xOffset = x * blockWidth;
            const yOffset = y * blockHeight;
            let isCloud = false;

            for (let i = 0; i < blockWidth; i++) {
                for (let j = 0; j < blockHeight; j++) {
                    const pixel = Jimp.intToRGBA(image.getPixelColor(xOffset + i, yOffset + j));
                    if (pixel.r > 200 && pixel.g > 200 && pixel.b > 200) {
                        isCloud = true;
                        break;
                    }
                }
                if (isCloud) break;
            }

            if (x === 1 && y === 1) {
                centralBlockParity = isCloud ? 1 : 0;
            } else {
                key.push(isCloud ? 1 : 0);
            }
        }
    }

    const parityCheck = key.reduce((acc, val) => acc + val, 0) % 2;
    if (parityCheck !== centralBlockParity) {
        throw new Error('Central block parity check failed.');
    }

    return key;
};

const processVideo = async (videoPath) => {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .on('end', () => {
                const frameFiles = fs.readdirSync(tempDir).filter(file => file.endsWith('.png'));
                const keys = Promise.all(frameFiles.map(file => processFrame(path.join(tempDir, file))));
                resolve(keys);
            })
            .on('error', reject)
            .screenshots({
                folder: tempDir,
                filename: 'frame-%03d.png',
                count: 10
            });
    });
};

module.exports = {
    processVideo,
    processFrame
};
