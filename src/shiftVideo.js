
const ffmpeg = require('fluent-ffmpeg');

const shiftVideo = (inputPath, outputPath, shiftX, shiftY) => {
    const command = ffmpeg(inputPath)
        .videoFilters(`crop=in_w-${Math.abs(shiftX)}:in_h-${Math.abs(shiftY)},pad=w=in_w:h=in_h:x=${shiftX > 0 ? shiftX : 0}:y=${shiftY > 0 ? shiftY : 0}`)
        .save(outputPath);

    return new Promise((resolve, reject) => {
        command.on('end', resolve);
        command.on('error', reject);
    });
};

const inputVideoPath = 'clouds.mp4';
const shiftedVideoPath = 'shifted_clouds.mp4';
const shiftX = 10; // Сдвиг на 10 пикселей вправо
const shiftY = 10; // Сдвиг на 10 пикселей вниз

shiftVideo(inputVideoPath, shiftedVideoPath, shiftX, shiftY)
    .then(() => {
        console.log('Video shifted successfully');
    })
    .catch((err) => {
        console.error('Error shifting video:', err);
    });

const shiftVideo = (inputPath, outputPath, shiftX, shiftY) => {
    const command = ffmpeg(inputPath)
        .videoFilters(`crop=in_w-${Math.abs(shiftX)}:in_h-${Math.abs(shiftY)},pad=w=in_w:h=in_h:x=${shiftX > 0 ? shiftX : 0}:y=${shiftY > 0 ? shiftY : 0}`)
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

const shiftVideo = (inputPath, outputPath, shiftX, shiftY) => {
    const command = ffmpeg(inputPath)
        .videoFilters(`crop=in_w-${Math.abs(shiftX)}:in_h-${Math.abs(shiftY)},pad=w=in_w:h=in_h:x=${shiftX > 0 ? shiftX : 0}:y=${shiftY > 0 ? shiftY : 0}`)
        .save(outputPath);

    return new Promise((resolve, reject) => {
        command.on('end', resolve);
        command.on('error', reject);
    });
};

module.exports = shiftVideo;
