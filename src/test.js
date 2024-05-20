
const { processVideo, processFrame } = require('./processVideo');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testShiftVideo = () => {
    const inputVideoPath = 'clouds.mp4';
    const shiftedVideoPath = 'shifted_clouds.mp4';
    execSync(`node src/shiftVideo.js ${inputVideoPath} ${shiftedVideoPath} 10 10`);
    console.log('Video shifted successfully');
};

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
