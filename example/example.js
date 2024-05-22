
const { processVideo } = require('../src/processVideo');
const ffmpeg = require('fluent-ffmpeg');

const inputVideo = 'clouds.mp4';
const outputVideoAlice = 'shifted_clouds_alice.mp4';
const outputVideoBob = 'shifted_clouds_bob.mp4';
const cropWidth = 640;
const cropHeight = 480;
const shiftXAlice = 10;
const shiftYAlice = 10;
const shiftXBob = -10;
const shiftYBob = -10;

const cropAndShiftVideo = (inputPath, outputPathAlice, outputPathBob, cropWidth, cropHeight, shiftXAlice, shiftYAlice, shiftXBob, shiftYBob) => {
  const cropFilter = `crop=${cropWidth}:${cropHeight}`;
  const shiftFilterAlice = `,translate=${shiftXAlice}:${shiftYAlice}`;
  const shiftFilterBob = `,translate=${shiftXBob}:${shiftYBob}`;

  return Promise.all([
    new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilter(cropFilter + shiftFilterAlice)
        .output(outputPathAlice)
        .on('end', () => {
          console.log(`Alice's video created at ${outputPathAlice}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error processing Alice's video: ${err.message}`);
          reject(err);
        })
        .run();
    }),
    new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilter(cropFilter + shiftFilterBob)
        .output(outputPathBob)
        .on('end', () => {
          console.log(`Bob's video created at ${outputPathBob}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error processing Bob's video: ${err.message}`);
          reject(err);
        })
        .run();
    })
  ]);
};

(async () => {
  await cropAndShiftVideo(inputVideo, outputVideoAlice, outputVideoBob, cropWidth, cropHeight, shiftXAlice, shiftYAlice, shiftXBob, shiftYBob);
  console.log("Videos cropped and shifted successfully.");

  console.log("Processing Alice's video to generate OTP keys...");
  const keysAlice = await processVideo(outputVideoAlice);
  keysAlice.forEach((key, index) => console.log(`Frame ${index + 1}: `, key));

  console.log("Processing Bob's video to generate OTP keys...");
  const keysBob = await processVideo(outputVideoBob);
  keysBob.forEach((key, index) => console.log(`Frame ${index + 1}: `, key));

  console.log("Comparing keys...");
  const keysEqual = keysAlice.every((key, index) => JSON.stringify(key) === JSON.stringify(keysBob[index]));
  console.log("Are Alice's keys equal to Bob's keys:", keysEqual);
})();
