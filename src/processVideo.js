
const ffmpeg = require('fluent-ffmpeg');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const processFrame = async (framePath) => {
    const image = await Jimp.read(framePath);
    const { width, height } = image.bitmap;
    const gridSize = 3;
    const blockWidth = Math.floor(width / gridSize);
    const blockHeight = Math.floor(height / gridSize);
    
    let binaryKey = [];
    let parityCheck = 0;
    
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const x = j * blockWidth;
            const y = i * blockHeight;
            const block = image.clone().crop(x, y, blockWidth, blockHeight);
            const avgBrightness = block.bitmap.data.reduce((sum, value, idx) => {
                return sum + (idx % 4 === 0 ? value : 0);
            }, 0) / (blockWidth * blockHeight);
            
            if (avgBrightness > 127) {
                if (!(i === 1 && j === 1)) {
                    binaryKey.push(1);
                }
                parityCheck += 1;
            } else {
                if (!(i === 1 && j === 1)) {
                    binaryKey.push(0);
                }
            }
        }
    }
    
    const centralBlock = image.clone().crop(blockWidth, blockHeight, blockWidth, blockHeight);
    const avgCentralBrightness = centralBlock.bitmap.data.reduce((sum, value, idx) => {
        return sum + (idx % 4 === 0 ? value : 0);
    }, 0) / (blockWidth * blockHeight);
    const centralParity = avgCentralBrightness > 127 ? 1 : 0;
    
    if (centralParity !== parityCheck % 2) {
        console.warn("Central block parity check failed.");
    }
    
    return binaryKey;
};

const processVideo = async (videoPath) => {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const command = ffmpeg(videoPath)
        .outputOptions('-vf', 'fps=1')
        .save(path.join(tempDir, 'frame_%04d.png'));

    return new Promise((resolve, reject) => {
        command.on('end', async () => {
            const frameFiles = fs.readdirSync(tempDir).filter(file => file.endsWith('.png'));
            let frameKeys = [];
            for (const frameFile of frameFiles) {
                try {
                    const framePath = path.join(tempDir, frameFile);
                    const key = await processFrame(framePath);
                    frameKeys.push(key);
                } catch (error) {
                    console.error(error);
                }
            }
            resolve(frameKeys);
        });

        command.on('error', (err) => {
            reject(err);
        });
    });
};

module.exports = { processFrame, processVideo };
