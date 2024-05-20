
# OTP Cloud

OTP Cloud - CLI and library for processing and shifting videos for cloud-based OTP generation.

## Installation

```
npm install
```

## Usage

### CLI

```
Usage: otp-cloud [options] [command]

Options:
  -V, --version          output the version number
  -h, --help             display help for command

Commands:
  process <videoPath>    Process a video to generate OTP keys
  shift <inputPath> <outputPath> <shiftX> <shiftY>  Shift a video
  help [command]         display help for command
```

### API

```javascript
const { processVideo } = require('./src/processVideo');
const shiftVideo = require('./src/shiftVideo');

const videoPath = 'path/to/video.mp4';
processVideo(videoPath).then(keys => {
    console.log(keys);
});

const inputPath = 'path/to/input.mp4';
const outputPath = 'path/to/output.mp4';
const shiftX = 10;
const shiftY = 10;
shiftVideo(inputPath, outputPath, shiftX, shiftY).then(() => {
    console.log('Video shifted successfully');
});
```
