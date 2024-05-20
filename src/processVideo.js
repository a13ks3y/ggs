
const processFrame = async (framePath) => {
    const image = await Jimp.read(framePath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const blockSize = Math.floor(width / 3);
    
    const blocks = [];
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            const xOffset = x * blockSize;
            const yOffset = y * blockSize;
            const block = image.clone().crop(xOffset, yOffset, blockSize, blockSize);
            const isCloud = block.bitmap.data.some(pixel => pixel < 128);
            blocks.push(isCloud ? 1 : 0);
        }
    }
    
    const parityCheck = blocks.splice(4, 1)[0];
    const parity = blocks.reduce((a, b) => a ^ b, 0);
    if (parity !== parityCheck) {
        console.log('Central block parity check failed.', { blocks, parityCheck, parity });
        throw new Error('Central block parity check failed.');
    }
    
    return blocks;
};

const processVideo = async (videoPath) => {
    const framesDir = path.join(__dirname, 'frames');
    if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir);
    }
    
    await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .output(path.join(framesDir, 'frame_%04d.png'))
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
    
    const frameFiles = fs.readdirSync(framesDir).filter(file => file.endsWith('.png'));
    const keys = [];
    for (const frameFile of frameFiles) {
        const framePath = path.join(framesDir, frameFile);
        try {
            const key = await processFrame(framePath);
            keys.push(key);
        } catch (error) {
            console.error(error.message);
        }
    }
    
    return keys;
};

module.exports = { processVideo, processFrame };
