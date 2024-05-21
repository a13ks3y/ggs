const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Создание директории для примеров
const examplePath = path.join(__dirname, '../example');
if (!fs.existsSync(examplePath)) {
    fs.mkdirSync(examplePath);
}

const inputDir = path.join(examplePath, 'input');
const outputDir = path.join(examplePath, 'output');

if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir);
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const exampleCode = `
// This script demonstrates a real-life usage example of the OTP Cloud project

const { processVideo } = require('../src/processVideo');
const shiftVideo = require('../src/shiftVideo');
const path = require('path');
const fs = require('fs');

const compareKeys = (keys1, keys2) => {
    if (keys1.length !== keys2.length) {
        console.log('Keys have different lengths');
        return false;
    }
    let areEqual = true;
    for (let i = 0; i < keys1.length; i++) {
        if (keys1[i].toString() !== keys2[i].toString()) {
            console.log(\`Mismatch at frame \${i + 1}\`);
            console.log('Original key:', keys1[i]);
            console.log('Shifted key: ', keys2[i]);
            areEqual = false;
        }
    }
    return areEqual;
};

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
    await shiftVideo(videoPath, shiftedVideoPath, 2, 2); // Use smaller shift values
    console.log('Video shifted successfully.');

    // Step 3: Process the shifted video to generate new OTP keys
    console.log('Processing shifted video to generate new OTP keys...');
    const shiftedKeys = await processVideo(shiftedVideoPath);
    shiftedKeys.forEach((key, index) => {
        console.log(\`Shifted Frame \${index + 1}: \`, key);
    });

    // Step 4: Compare keys
    console.log('Comparing keys...');
    const areKeysEqual = compareKeys(keys, shiftedKeys);
    console.log('Are original keys equal to shifted keys:', areKeysEqual);
};

main().catch(console.error);
`;

fs.writeFileSync(path.join(examplePath, 'example.js'), exampleCode);

// Обновление README.md для включения примера использования
const readmePath = path.join(__dirname, '../README.md');
let readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';

const detailedDescription = `
## Detailed Description of the Algorithm

### Overview

The OTP Cloud project uses a novel approach to generate one-time passwords (OTPs) based on cloud patterns in video frames. The process involves capturing a video of the sky, processing the video to extract OTP keys from the cloud patterns, and optionally shifting the video to create a new set of OTP keys.

### Algorithm Steps

1. **Video Capture**: A video of the sky is captured. The video should be in MP4 format.
2. **Frame Extraction**: The video is processed to extract individual frames.
3. **Grid Analysis**: Each frame is divided into a 3x3 grid, creating 9 blocks.
4. **Cloud Detection**: For each block, the presence of clouds is detected based on pixel brightness. A block is considered to contain clouds if the majority of pixels are white (high brightness).
5. **OTP Key Generation**: A binary key is generated for each frame, where each bit represents the presence (1) or absence (0) of clouds in the corresponding block.
6. **Video Shifting (Optional)**: The video can be shifted by a specified number of pixels to create a new set of frames, which can then be processed to generate a different set of OTP keys. This feature was initially added to test if insignificant shift will not influence the result.

### Possible Scenarios of Usage

1. **Secure Communication**: Two parties can use the same video of the sky to generate identical OTP keys for secure communication. By synchronizing the video capture and processing, they can ensure that their OTP keys match.
2. **Dynamic Key Generation**: By capturing different videos at different times, users can dynamically generate new OTP keys without relying on traditional key distribution methods.
3. **Enhanced Security**: The shifting mechanism allows users to generate multiple sets of OTP keys from the same video, enhancing security by providing a way to easily change keys.

## Example Usage

To see a real-life usage example, follow these steps:

1. Place an input video named \`clouds.mp4\` in the \`example/input\` directory.
2. Run the example script:

\`\`\`sh
node example/example.js
\`\`\`

This will process the input video to generate OTP keys, shift the video, process the shifted video to generate new OTP keys, and compare the original and shifted keys. The output will be displayed in the console.
`;

if (!readmeContent.includes('## Detailed Description of the Algorithm')) {
    readmeContent += detailedDescription;
}

fs.writeFileSync(readmePath, readmeContent);

// Обновление CHANGELOG.md и логирование запросов
const changelogPath = path.join(__dirname, '../CHANGELOG.md');
let changelogContent = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';

const changelogEntry = `
## [1.0.8] - 2024-05-21
### Added
- Added detailed description of the algorithm and possible usage scenarios to README.md.
- Added end-to-end test to compare original and shifted keys with detailed mismatch output.

### Requests
- ${process.argv.slice(2).join(' ')}
`;

if (!changelogContent.includes('## [1.0.8] - 2024-05-21')) {
    changelogContent += changelogEntry;
}

fs.writeFileSync(changelogPath, changelogContent);

// Обновление package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.version = "1.0.8";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Автоматизация git-команд
execSync('git add .', { stdio: 'inherit' });
execSync(`git commit -m "Apply patch-1.0.8.js: ${process.argv.slice(2).join(' ')}"`, { stdio: 'inherit' });
execSync('git push origin master', { stdio: 'inherit' });

// Создание следующего патча и открытие его в редакторе
const nextPatchNumber = 9;
const nextPatchFilename = path.join(__dirname, '../.generated', `patch-1.0.${nextPatchNumber}.js`);
fs.writeFileSync(nextPatchFilename, '');
execSync(`code ${nextPatchFilename}`, { stdio: 'inherit' });

console.log('Patch applied. Use "npm test" to run the tests.');

console.log('Example script created. Use "node example/example.js" to run the example.');
