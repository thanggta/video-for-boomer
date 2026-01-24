import { writeFile, readFile, exec, deleteFile, uint8ArrayToBlob } from './ffmpegService';

export interface AudioAdjustmentResult {
  blob: Blob;
  outputFileName: string;
}

/**
 * Adjust audio duration to match video duration
 * - If audio is shorter: loop it
 * - If audio is longer: trim it
 */
export const adjustAudioDuration = async (
  audioBlob: Blob,
  videoDuration: number,
  audioDuration: number,
  onProgress?: (progress: number) => void
): Promise<AudioAdjustmentResult> => {
  const inputFileName = 'input_audio.m4a';
  const outputFileName = 'adjusted_audio.m4a';

  try {
    // Write audio file to FFmpeg filesystem
    await writeFile(inputFileName, audioBlob);
    onProgress?.(10);

    if (audioDuration < videoDuration) {
      // Audio is shorter - loop it
      await loopAudio(inputFileName, outputFileName, videoDuration, audioDuration, onProgress);
    } else if (audioDuration > videoDuration) {
      // Audio is longer - trim it
      await trimAudio(inputFileName, outputFileName, videoDuration, onProgress);
    } else {
      // Audio duration matches video duration - convert to AAC with high quality
      await exec([
        '-i',
        inputFileName,
        '-vn', // Explicitly disable video
        '-c:a',
        'aac',
        '-b:a',
        '256k', // Higher bitrate for better quality
        '-ar',
        '44100',
        outputFileName,
      ]);
      onProgress?.(90);
    }

    // Read the output file
    const outputData = await readFile(outputFileName);
    const outputBlob = uint8ArrayToBlob(outputData, 'audio/mp4');
    onProgress?.(100);

    // Cleanup
    await deleteFile(inputFileName);
    await deleteFile(outputFileName);

    return {
      blob: outputBlob,
      outputFileName: outputFileName,
    };
  } catch (error) {
    // Cleanup on error
    await deleteFile(inputFileName);
    await deleteFile(outputFileName);
    throw error;
  }
};

/**
 * Loop audio to match video duration
 */
const loopAudio = async (
  inputFileName: string,
  outputFileName: string,
  targetDuration: number,
  audioDuration: number,
  onProgress?: (progress: number) => void
): Promise<void> => {
  // Calculate how many times to loop
  const loopCount = Math.ceil(targetDuration / audioDuration);

  console.log(
    `Looping audio ${loopCount} times to match video duration (${targetDuration}s vs ${audioDuration}s)`
  );

  onProgress?.(30);

  // Create a temporary concat file
  const concatFileName = 'concat_list.txt';
  let concatContent = '';

  for (let i = 0; i < loopCount; i++) {
    concatContent += `file '${inputFileName}'\n`;
  }

  // Write concat list to FFmpeg filesystem
  const encoder = new TextEncoder();
  await writeFile(concatFileName, encoder.encode(concatContent));

  onProgress?.(50);

  // Use FFmpeg concat demuxer to loop audio, then trim to exact duration
  // Re-encode to AAC for MP4 compatibility (YouTube audio is often Opus)
  try {
    await exec([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatFileName,
      '-t',
      targetDuration.toString(),
      '-vn', // Explicitly disable video
      '-c:a',
      'aac',
      '-b:a',
      '256k', // Higher bitrate for better quality
      '-ar',
      '44100',
      outputFileName,
    ]);

    onProgress?.(90);

    // Cleanup concat file
    await deleteFile(concatFileName);
  } catch (error) {
    await deleteFile(concatFileName);
    throw error;
  }
};

/**
 * Trim audio to match video duration
 */
const trimAudio = async (
  inputFileName: string,
  outputFileName: string,
  targetDuration: number,
  onProgress?: (progress: number) => void
): Promise<void> => {
  console.log(`Trimming audio to ${targetDuration}s`);

  onProgress?.(50);

  // Trim audio to target duration
  // Re-encode to AAC for MP4 compatibility (YouTube audio is often Opus)
  await exec([
    '-i',
    inputFileName,
    '-t',
    targetDuration.toString(),
    '-vn', // Explicitly disable video
    '-c:a',
    'aac',
    '-b:a',
    '256k', // Higher bitrate for better quality
    '-ar',
    '44100',
    outputFileName,
  ]);

  onProgress?.(90);
};

/**
 * Convert audio to AAC format (compatible with MP4)
 */
export const convertToAAC = async (
  audioBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const inputFileName = 'input_audio.m4a';
  const outputFileName = 'output_audio.aac';

  try {
    await writeFile(inputFileName, audioBlob);
    onProgress?.(30);

    // Convert to AAC with high quality bitrate
    await exec([
      '-i',
      inputFileName,
      '-vn', // Explicitly disable video
      '-c:a',
      'aac',
      '-b:a',
      '256k', // Higher bitrate for better quality
      '-ar',
      '44100',
      outputFileName,
    ]);

    onProgress?.(80);

    const outputData = await readFile(outputFileName);
    const outputBlob = uint8ArrayToBlob(outputData, 'audio/aac');
    onProgress?.(100);

    // Cleanup
    await deleteFile(inputFileName);
    await deleteFile(outputFileName);

    return outputBlob;
  } catch (error) {
    await deleteFile(inputFileName);
    await deleteFile(outputFileName);
    throw error;
  }
};

/**
 * Get audio codec information
 */
export const getAudioCodec = async (audioBlob: Blob): Promise<string> => {
  // This would require parsing FFmpeg output
  // For now, return a default
  return 'aac';
};
