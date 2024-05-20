const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Функция для проверки и установки npm пакетов
const installPackages = () => {
    const packages = ['fluent-ffmpeg', 'jimp'];
    packages.forEach(pkg => {
        execSync(`npm install ${pkg}`, { stdio: 'inherit' });
    });
};

// Убедимся, что директория src существует
const srcDir = path.join(__dirname, 'src');
if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir);
}

// Создание файла для обработки видео
const processVideoCode = `
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
`;

fs.writeFileSync(path.join(srcDir, 'processVideo.js'), processVideoCode);

// Создание файла для сдвига видео
const shiftVideoCode = `
const ffmpeg = require('fluent-ffmpeg');

const shiftVideo = (inputPath, outputPath, shiftX, shiftY) => {
    const command = ffmpeg(inputPath)
        .videoFilters(\`crop=in_w-\${Math.abs(shiftX)}:in_h-\${Math.abs(shiftY)},pad=w=in_w:h=in_h:x=\${shiftX > 0 ? shiftX : 0}:y=\${shiftY > 0 ? shiftY : 0}\`)
        .save(outputPath);

    return new Promise((resolve, reject) => {
        command.on('end', resolve);
        command.on('error', reject);
    });
};

const inputVideoPath = 'clouds.mp4';
const shiftedVideoPath = 'shifted_clouds.mp4';
const shiftX = 10; // Сдвиг на 10 пикселей вправо
const shiftY = 10; // Сдвиг на 10 пикселей вниз

shiftVideo(inputVideoPath, shiftedVideoPath, shiftX, shiftY)
    .then(() => {
        console.log('Video shifted successfully');
    })
    .catch((err) => {
        console.error('Error shifting video:', err);
    });
`;

fs.writeFileSync(path.join(srcDir, 'shiftVideo.js'), shiftVideoCode);

// Создание юнит-тестов
const testCode = `
const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { processFrame } = require('./processVideo');

// Тест для функции shiftVideo
const testShiftVideo = () => {
    const inputPath = 'clouds.mp4';
    const outputPath = 'shifted_clouds.mp4';
    const shiftX = 10;
    const shiftY = 10;
    const command = \`node src/shiftVideo.js \${inputPath} \${outputPath} \${shiftX} \${shiftY}\`;
    execSync(command, { stdio: 'inherit' });
    assert(fs.existsSync(outputPath), 'Shifted video not created');
};

// Тест для функции processFrame
const testProcessFrame = async () => {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        console.error('Temp directory does not exist for testing');
        return;
    }
    const frameFiles = fs.readdirSync(tempDir).filter(file => file.endsWith('.png'));
    if (frameFiles.length === 0) {
        console.error('No frame files found for testing');
        return;
    }
    const framePath = path.join(tempDir, frameFiles[0]);
    const key = await processFrame(framePath);
    assert(Array.isArray(key), 'Key is not an array');
    assert(key.length === 8, 'Key length is not 8');
};

try {
    testShiftVideo();
    testProcessFrame().then(() => console.log('All tests passed')).catch(console.error);
} catch (error) {
    console.error('Test failed', error);
}
`;

fs.writeFileSync(path.join(srcDir, 'test.js'), testCode);

// Обновление package.json для добавления тестового скрипта
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.scripts = {
    ...packageJson.scripts,
    "test": "node src/test.js"
};
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Patch applied. Use "npm test" to run the tests.');
console.log('Installing necessary packages...');
installPackages();
