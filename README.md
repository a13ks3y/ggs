# OTP Cloud

## Overview

The OTP Cloud project uses a novel approach to generate one-time passwords (OTPs) based on cloud patterns in video frames. The process involves capturing a video of the sky, processing the video to extract OTP keys from the cloud patterns, and optionally shifting the video to create a new set of OTP keys.

## Algorithm Steps

1. **Video Capture**: A video of the sky is captured. The video should be in MP4 format.
2. **Frame Extraction**: The video is processed to extract individual frames.
3. **Grid Analysis**: Each frame is divided into a 3x3 grid, creating 9 blocks.
4. **Cloud Detection**: For each block, the presence of clouds is detected based on pixel brightness. A block is considered to contain clouds if the majority of pixels are white (high brightness).
5. **OTP Key Generation**: A binary key is generated for each frame, where each bit represents the presence (1) or absence (0) of clouds in the corresponding block.
6. **Video Shifting (Optional)**: The video can be shifted by a specified number of pixels to create a new set of frames, which can then be processed to generate a different set of OTP keys. This feature was initially added to test if insignificant shift will not influence the result.

## Usage Scenarios

1. **Secure Communication**: Two parties can use the same video of the sky to generate identical OTP keys for secure communication. By synchronizing the video capture and processing, they can ensure that their OTP keys match.
2. **Dynamic Key Generation**: By capturing different videos at different times, users can dynamically generate new OTP keys without relying on traditional key distribution methods.
3. **Enhanced Security**: The shifting mechanism allows users to generate multiple sets of OTP keys from the same video, enhancing security by providing a way to easily change keys.

## Example Usage

To see a real-life usage example, follow these steps:

1. Place an input video named `clouds.mp4` in the `example/input` directory.
2. Run the example script:

```sh
node example/example.js
