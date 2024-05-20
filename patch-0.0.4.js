const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Убедимся, что директория src существует
const srcDir = path.join(__dirname, 'src');
if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir);
}

// Убедимся, что установлены необходимые пакеты
const installPackages = () => {
    const packages = ['fluent-ffmpeg', 'jimp', 'commander'];
    packages.forEach(pkg => {
        execSync(`npm install ${pkg} --save`, { stdio: 'inherit' });
    });
};
installPackages();

// Обновление или создание файла processVideo.js
const processVideoPath = path.join(srcDir, 'processVideo.js');
let processVideoCode = '';

if (fs.existsSync(processVideoPath)) {
    processVideoCode = fs.readFileSync(processVideoPath, 'utf8');
} else {
    processVideoCode = `
const ffmpeg = require('fluent-ffmpeg');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
`;
}

if (!processVideoCode.includes('const processFrame = async (framePath) =>')) {
    processVideoCode += `
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
`;
}

if (!processVideoCode.includes('const processVideo = async (videoPath) =>')) {
    processVideoCode += `
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
}

fs.writeFileSync(processVideoPath, processVideoCode);

// Обновление или создание файла shiftVideo.js
const shiftVideoPath = path.join(srcDir, 'shiftVideo.js');
let shiftVideoCode = '';

if (fs.existsSync(shiftVideoPath)) {
    shiftVideoCode = fs.readFileSync(shiftVideoPath, 'utf8');
} else {
    shiftVideoCode = `
const ffmpeg = require('fluent-ffmpeg');
`;
}

if (!shiftVideoCode.includes('const shiftVideo = (inputPath, outputPath, shiftX, shiftY) =>')) {
    shiftVideoCode += `
const shiftVideo = (inputPath, outputPath, shiftX, shiftY) => {
    const command = ffmpeg(inputPath)
        .videoFilters(\`crop=in_w-\${Math.abs(shiftX)}:in_h-\${Math.abs(shiftY)},pad=w=in_w:h=in_h:x=\${shiftX > 0 ? shiftX : 0}:y=\${shiftY > 0 ? shiftY : 0}\`)
        .save(outputPath);

    return new Promise((resolve, reject) => {
        command.on('end', resolve);
        command.on('error', reject);
    });
};

module.exports = shiftVideo;

if (require.main === module) {
    const inputVideoPath = process.argv[2];
    const shiftedVideoPath = process.argv[3];
    const shiftX = parseInt(process.argv[4], 10);
    const shiftY = parseInt(process.argv[5], 10);

    shiftVideo(inputVideoPath, shiftedVideoPath, shiftX, shiftY)
        .then(() => {
            console.log('Video shifted successfully');
        })
        .catch((err) => {
            console.error('Error shifting video:', err);
        });
}
`;
}

fs.writeFileSync(shiftVideoPath, shiftVideoCode);

// Создание или обновление CLI интерфейса
const cliPath = path.join(srcDir, 'cli.js');
let cliCode = '';

if (fs.existsSync(cliPath)) {
    cliCode = fs.readFileSync(cliPath, 'utf8');
} else {
    cliCode = `
const { Command } = require('commander');
const { processVideo } = require('./processVideo');
const shiftVideo = require('./shiftVideo');
`;
}

if (!cliCode.includes('const program = new Command();')) {
    cliCode += `
const program = new Command();

program
    .version('1.0.0')
    .description('OTP Cloud - CLI for processing and shifting videos for cloud-based OTP generation');

program
    .command('process <videoPath>')
    .description('Process a video to generate OTP keys')
    .action(async (videoPath) => {
        const keys = await processVideo(videoPath);
        keys.forEach((key, index) => {
            console.log(\`Frame \${index + 1}: \`, key);
        });
    });

program
    .command('shift <inputPath> <outputPath> <shiftX> <shiftY>')
    .description('Shift a video')
    .action((inputPath, outputPath, shiftX, shiftY) => {
        shiftVideo(inputPath, outputPath, parseInt(shiftX, 10), parseInt(shiftY, 10))
            .then(() => {
                console.log('Video shifted successfully');
            })
            .catch((err) => {
                console.error('Error shifting video:', err);
            });
    });

program.parse(process.argv);
`;
}

fs.writeFileSync(cliPath, cliCode);

// Создание или обновление README.md
const readmePath = path.join(__dirname, 'README.md');
let readmeContent = '';

if (fs.existsSync(readmePath)) {
    readmeContent = fs.readFileSync(readmePath, 'utf8');
} else {
    readmeContent = `
# OTP Cloud

OTP Cloud - CLI and library for processing and shifting videos for cloud-based OTP generation.

## Installation

\`\`\`
npm install
\`\`\`

## Usage

### CLI

\`\`\`
Usage: otp-cloud [options] [command]

Options:
  -V, --version          output the version number
  -h, --help             display help for command

Commands:
  process <videoPath>    Process a video to generate OTP keys
  shift <inputPath> <outputPath> <shiftX> <shiftY>  Shift a video
  help [command]         display help for command
\`\`\`

### API

\`\`\`javascript
const { processVideo } = require('./src/processVideo');
const shiftVideo = require('./src/shiftVideo');

const videoPath = 'path/to/video.mp4';
processVideo(videoPath).then(keys => {
    console.log(keys);
});

const inputPath = 'path/to/input.mp4';
const outputPath = 'path/to/output.mp4';
const shiftX = 10;
const shiftY = 10;
shiftVideo(inputPath, outputPath, shiftX, shiftY).then(() => {
    console.log('Video shifted successfully');
});
\`\`\`
`;
}

fs.writeFileSync(readmePath, readmeContent);

// Создание или обновление CHANGELOG.md
const changelogPath = path.join(__dirname, 'CHANGELOG.md');
let changelogContent = '';

if (fs.existsSync(changelogPath)) {
    changelogContent = fs.readFileSync(changelogPath, 'utf8');
} else {
    changelogContent = `
# Changelog

## [1.0.0] - 2024-05-20
### Added
- Initial release with video processing and shifting capabilities.
- CLI interface for processing and shifting videos.
- API for using as a library.
`;
}

fs.writeFileSync(changelogPath, changelogContent);

// Обновление package.json для добавления тестового скрипта и CLI команды
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.scripts) packageJson.scripts = {};
packageJson.scripts.test = "node src/test.js";
packageJson.scripts.start = "node src/cli.js";

if (!packageJson.bin) packageJson.bin = {};
packageJson.bin['otp-cloud'] = "./src/cli.js";

if (!packageJson.version) packageJson.version = "1.0.0";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Patch applied. Use "npm test" to run the tests.');