const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Создание директории для примеров
const examplePath = path.join(__dirname, '../example');
if (!fs.existsSync(examplePath)) {
    fs.mkdirSync(examplePath);
}

const exampleCode = `
// This script demonstrates a real-life usage example of the OTP Cloud project

const { processVideo } = require('../src/processVideo');
const shiftVideo = require('../src/shiftVideo');
const path = require('path');
const fs = require('fs');

const main = async () => {
    // Path to the input video
    const videoPath = path.join(__dirname, 'input', 'clouds.mp4');
    if (!fs.existsSync(videoPath)) {
        console.error('Input video not found. Please add a video named "clouds.mp4" in the "input" folder.');
        return;
    }

    // Step 1: Process the video to generate OTP keys
    console.log('Processing video to generate OTP keys...');
    const keys = await processVideo(videoPath);
    keys.forEach((key, index) => {
        console.log(\`Frame \${index + 1}: \`, key);
    });

    // Step 2: Shift the video
    const shiftedVideoPath = path.join(__dirname, 'output', 'shifted_clouds.mp4');
    console.log('Shifting video...');
    await shiftVideo(videoPath, shiftedVideoPath, 10, 10);
    console.log('Video shifted successfully.');

    // Step 3: Process the shifted video to generate new OTP keys
    console.log('Processing shifted video to generate new OTP keys...');
    const shiftedKeys = await processVideo(shiftedVideoPath);
    shiftedKeys.forEach((key, index) => {
        console.log(\`Shifted Frame \${index + 1}: \`, key);
    });
};

main().catch(console.error);
`;

fs.writeFileSync(path.join(examplePath, 'example.js'), exampleCode);

// Создание директорий для входного и выходного видео
const inputDir = path.join(examplePath, 'input');
const outputDir = path.join(examplePath, 'output');

if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir);
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Обновление README.md для включения примера использования
const readmePath = path.join(__dirname, '../README.md');
let readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';

// Обновление README.md для включения инструкций по использованию CLI
const exampleUsage = `
## Example Usage

To see a real-life usage example, follow these steps:

1. Place an input video named \`clouds.mp4\` in the \`example/input\` directory.
2. Run the example script:

\`\`\`sh
node example/example.js
\`\`\`

This will process the input video to generate OTP keys, shift the video, and then process the shifted video to generate new OTP keys. The output will be displayed in the console.
`;

if (!readmeContent.includes('## Example Usage')) {
    readmeContent += exampleUsage;
}

fs.writeFileSync(readmePath, readmeContent);

// Обновление CHANGELOG.md и логирование запросов
const changelogPath = path.join(__dirname, '../CHANGELOG.md');
let changelogContent = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';

const changelogEntry = `
## [1.0.4] - 2024-05-21
### Added
- Added a real-life usage example in the \`example\` directory.

### Requests
- ${process.argv.slice(2).join(' ')}
`;

if (!changelogContent.includes('## [1.0.4] - 2024-05-21')) {
    changelogContent += changelogEntry;
}

fs.writeFileSync(changelogPath, changelogContent);

// Обновление package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts['latest-patch'] = "node .generated/patch-1.0.5.js";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Автоматизация git-команд
execSync('git add .', { stdio: 'inherit' });
execSync(`git commit -m "Apply patch-1.0.4.js: ${process.argv.slice(2).join(' ')}"`, { stdio: 'inherit' });
execSync('git push origin master', { stdio: 'inherit' });

// Создание следующего патча и открытие его в редакторе
const nextPatchNumber = 5;
const nextPatchFilename = path.join(__dirname, '../.generated', `patch-1.0.${nextPatchNumber}.js`);
fs.writeFileSync(nextPatchFilename, '');
execSync(`code ${nextPatchFilename}`, { stdio: 'inherit' });

console.log('Patch applied. Use "npm test" to run the tests.');
