
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
    const command = `node src/shiftVideo.js ${inputPath} ${outputPath} ${shiftX} ${shiftY}`;
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
