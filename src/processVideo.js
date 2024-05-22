
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
            key.push(isCloud ? 1 : 0);
        }
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


const cropAndShiftVideo = (inputPath, outputPathAlice, outputPathBob, cropWidth, cropHeight, shiftXAlice, shiftYAlice, shiftXBob, shiftYBob) => {
  const ffmpeg = require('fluent-ffmpeg');
  
  const cropFilter = `crop=${cropWidth}:${cropHeight}`;
  const shiftFilterAlice = `,translate=${shiftXAlice}:${shiftYAlice}`;
  const shiftFilterBob = `,translate=${shiftXBob}:${shiftYBob}`;
  
  return Promise.all([
    new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilter(cropFilter + shiftFilterAlice)
        .output(outputPathAlice)
        .on('end', resolve)
        .on('error', reject)
        .run();
    }),
    new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilter(cropFilter + shiftFilterBob)
        .output(outputPathBob)
        .on('end', resolve)
        .on('error', reject)
        .run();
    })
  ]);
};

module.exports = {
  processVideo,
  processFrame,
  cropAndShiftVideo
};
