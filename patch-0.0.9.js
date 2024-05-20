const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Функция для установки npm пакетов
const installPackages = () => {
    const packages = ['fluent-ffmpeg', 'jimp', 'commander'];
    packages.forEach(pkg => {
        execSync(`npm install ${pkg} --save`, { stdio: 'inherit' });
    });
};

// Убедимся, что директория src существует
const srcDir = path.join(__dirname, 'src');
if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir);
}

// Убедимся, что установлены необходимые пакеты
installPackages();

// Обновление shiftVideo.js
const shiftVideoPath = path.join(srcDir, 'shiftVideo.js');
let shiftVideoCode = fs.readFileSync(shiftVideoPath, 'utf8');

const shiftVideoFunctionCode = `
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
`;

if (shiftVideoCode.includes('module.exports = shiftVideo;')) {
    shiftVideoCode = shiftVideoCode.replace(/const shiftVideo = .*;\nmodule.exports = shiftVideo;/s, '');
}
shiftVideoCode += shiftVideoFunctionCode;

const shiftVideoCliCode = `
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

if (!shiftVideoCode.includes('if (require.main === module) {')) {
    shiftVideoCode += shiftVideoCliCode;
}

fs.writeFileSync(shiftVideoPath, shiftVideoCode);

// Обновление cli.js
const cliPath = path.join(srcDir, 'cli.js');
let cliCode = fs.readFileSync(cliPath, 'utf8');

const cliProgramCode = `
const { Command } = require('commander');
const { processVideo } = require('./processVideo');
const shiftVideo = require('./shiftVideo');

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

cliCode = cliProgramCode;

fs.writeFileSync(cliPath, cliCode);

// Обновление test.js
const testPath = path.join(srcDir, 'test.js');
let testCode = fs.readFileSync(testPath, 'utf8');

const testProcessVideoCode = `
const { processVideo, processFrame } = require('./processVideo');

const testProcessVideo = async () => {
    const videoPath = 'clouds.mp4';
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    const keys = await processVideo(videoPath);
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
    testProcessVideo().then(() => console.log('All tests passed')).catch(console.error);
} catch (error) {
    console.error('Test failed', error);
}
`;

if (!testCode.includes('const testProcessVideo = async () =>')) {
    testCode += testProcessVideoCode;
}

fs.writeFileSync(testPath, testCode);

// Обновление README.md
const readmePath = path.join(__dirname, 'README.md');
let readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';

// Обновление README.md для включения инструкций по использованию CLI
const cliUsage = `
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

if (!readmeContent.includes('### CLI')) {
    readmeContent += cliUsage;
}

fs.writeFileSync(readmePath, readmeContent);

// Обновление CHANGELOG.md и логирование запросов
const changelogPath = path.join(__dirname, 'CHANGELOG.md');
let changelogContent = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';

const changelogEntry = `
## [1.0.0] - 2024-05-20
### Added
- Initial release with video processing and shifting capabilities.
- CLI interface for processing and shifting videos.
- API for using as a library.

### Requests
- ${process.argv.slice(2).join(' ')}
`;

if (!changelogContent.includes('## [1.0.0] - 2024-05-20')) {
    changelogContent += changelogEntry;
}

fs.writeFileSync(changelogPath, changelogContent);

// Обновление package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.scripts) packageJson.scripts = {};
packageJson.scripts.test = "node src/test.js";
packageJson.scripts.start = "node src/cli.js";
packageJson.scripts['latest-patch'] = "node patch-0.0.9.js";

if (!packageJson.bin) packageJson.bin = {};
packageJson.bin['otp-cloud'] = "./src/cli.js";

if (!packageJson.version) packageJson.version = "1.0.0";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Автоматизация git-команд
execSync('git add .', { stdio: 'inherit' });
execSync(`git commit -m "Apply patch-0.0.9.js: ${process.argv.slice(2).join(' ')}"`, { stdio: 'inherit' });

console.log('Patch applied. Use "npm test" to run the tests.');
  
