const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const readline = require('readline');
const config = require('./config.json');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question(`Enter input folder path (default: ${config.input_folder_path}): `, inputFolderPath => {
    rl.question(`Enter output folder path (default: ${config.output_folder_path}): `, outputFolderPath => {
        const inputDir = path.join(__dirname, inputFolderPath || config.input_folder_path);
        const outputDir = path.join(__dirname, outputFolderPath || config.output_folder_path);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        fs.readdir(inputDir, (err, files) => {
            if (err) {
                console.error('Error reading input directory:', err);
                rl.close();
                return;
            }

            files.forEach(file => {
                const inputFilePath = path.join(inputDir, file);
                const outputFilePath = path.join(outputDir, file);

                ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
                    if (err) {
                        console.error('Error getting video metadata:', err);
                        return;
                    }

                    const duration = metadata.format.duration;
                    const trimDuration = duration - config.trim_duration;

                    ffmpeg(inputFilePath)
                        .setStartTime(0)
                        .setDuration(trimDuration)
                        .output(outputFilePath)
                        .on(config.trim_start_or_end, () => {
                            console.log(`Successfully trimmed ${file}`);
                        })
                        .on('error', err => {
                            console.error(`Error trimming ${file}:`, err);
                        })
                        .run();
                });
            });

            rl.close();
        });
    });
});