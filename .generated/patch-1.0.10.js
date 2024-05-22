const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

// Define the cropAndShiftVideo function
const cropAndShiftVideo = (inputPath, outputPathAlice, outputPathBob, cropWidth, cropHeight, shiftXAlice, shiftYAlice, shiftXBob, shiftYBob) => {
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

// Update processVideo.js to export the cropAndShiftVideo function and define processFrame
const processVideoPath = path.join(__dirname, '../src', 'processVideo.js');
let processVideoCode = fs.readFileSync(processVideoPath, 'utf8');

if (!processVideoCode.includes('const processFrame =')) {
  const processFrameCode = `
const processFrame = (frame) => {
  // Define your processFrame logic here
  return frame;
};
  `;

  processVideoCode += `
${processFrameCode}
const cropAndShiftVideo = ${cropAndShiftVideo.toString()};

module.exports = {
  processVideo,
  cropAndShiftVideo,
  processFrame
};
`;
  fs.writeFileSync(processVideoPath, processVideoCode, 'utf8');
}

// Update package.json for new patch
const packageJsonPath = path.join(__dirname, '../', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts['latest-patch'] = "node .generated/patch-1.0.10.js";
packageJson.scripts['repatch'] = "node .generated/patch-1.0.10.js";
packageJson.version = "1.0.10";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Create example script
const examplePath = path.join(__dirname, '../example');
if (!fs.existsSync(examplePath)) {
  fs.mkdirSync(examplePath);
}

const exampleCode = `
const { processVideo, cropAndShiftVideo } = require('../src/processVideo');

const inputVideo = 'clouds.mp4';
const outputVideoAlice = 'shifted_clouds_alice.mp4';
const outputVideoBob = 'shifted_clouds_bob.mp4';
const cropWidth = 640;
const cropHeight = 480;
const shiftXAlice = 10;
const shiftYAlice = 10;
const shiftXBob = -10;
const shiftYBob = -10;

(async () => {
  await cropAndShiftVideo(inputVideo, outputVideoAlice, outputVideoBob, cropWidth, cropHeight, shiftXAlice, shiftYAlice, shiftXBob, shiftYBob);
  console.log('Videos cropped and shifted successfully.');

  console.log('Processing Alice\'s video to generate OTP keys...');
  const keysAlice = await processVideo(outputVideoAlice);
  keysAlice.forEach((key, index) => console.log(\`Frame \${index + 1}: \`, key));

  console.log('Processing Bob\'s video to generate OTP keys...');
  const keysBob = await processVideo(outputVideoBob);
  keysBob.forEach((key, index) => console.log(\`Frame \${index + 1}: \`, key));

  console.log('Comparing keys...');
  const keysEqual = keysAlice.every((key, index) => JSON.stringify(key) === JSON.stringify(keysBob[index]));
  console.log('Are Alice\'s keys equal to Bob\'s keys:', keysEqual);
})();
`;

fs.writeFileSync(path.join(examplePath, 'example.js'), exampleCode);

// Automate git commands
execSync('git add .', { stdio: 'inherit' });
execSync('git commit -m "Implement crop and shift video workflow in patch 1.0.10"', { stdio: 'inherit' });
execSync('git push origin master', { stdio: 'inherit' });

// Create next patch file and open in editor
const nextPatchNumber = 11;
const nextPatchFilename = path.join('.generated', `patch-1.0.${nextPatchNumber}.js`);
fs.writeFileSync(nextPatchFilename, '');
execSync(`code ${nextPatchFilename}`, { stdio: 'inherit' });

console.log('Patch applied. Use "npm test" to run the tests.');
