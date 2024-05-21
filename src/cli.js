
const { Command } = require('commander');
const { processVideo } = require('./processVideo');
const shiftVideo = require('./shiftVideo');

const program = new Command();

program
    .version('0.0.16')
    .description('OTP Cloud - CLI for processing and shifting videos for cloud-based OTP generation');

program
    .command('process <videoPath>')
    .description('Process a video to generate OTP keys')
    .action(async (videoPath) => {
        const keys = await processVideo(videoPath);
        keys.forEach((key, index) => {
            console.log(`Frame ${index + 1}: `, key);
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
