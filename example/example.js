
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
        console.log(`Frame ${index + 1}: `, key);
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
        console.log(`Shifted Frame ${index + 1}: `, key);
    });
};

main().catch(console.error);
