import { writeFile, readFile, exec, deleteFile, uint8ArrayToBlob, cleanup } from './ffmpegService';
import { adjustAudioDuration } from './audioProcessor';
import { VideoItem } from '@/types/video';
import { YouTubeAudioData } from '@/types/youtube';

export interface ProcessingProgress {
  currentVideo: number;
  totalVideos: number;
  currentOperation: string;
  progress: number; // 0-100
}

export interface ProcessedVideo {
  id: string;
  blob: Blob;
  fileName: string;
  originalVideo: VideoItem;
}

export interface ProcessingResult {
  success: boolean;
  processedVideos: ProcessedVideo[];
  errors: Array<{ videoId: string; error: string }>;
}

/**
 * Process a single video - replace its audio
 */
export const processVideo = async (
  video: VideoItem,
  audioData: YouTubeAudioData,
  format: string,
  onProgress?: (progress: number, operation: string) => void
): Promise<Blob> => {
  // Use unique filenames with timestamp to avoid conflicts
  const timestamp = Date.now();
  const videoExtension = format;
  const inputVideoFileName = `input_video_${timestamp}.${videoExtension}`;
  const adjustedAudioFileName = `adjusted_audio_${timestamp}.m4a`;
  const outputVideoFileName = `output_video_${timestamp}.${videoExtension}`;
  const mimeType = `video/${videoExtension === 'm4v' ? 'mp4' : videoExtension}`;

  try {
    onProgress?.(5, 'Đang tải video...');

    // Write video to FFmpeg filesystem
    await writeFile(inputVideoFileName, video.file);

    onProgress?.(15, 'Đang điều chỉnh âm thanh...');

    // Adjust audio duration to match video
    const adjustedAudio = await adjustAudioDuration(
      audioData.blob,
      video.duration,
      audioData.metadata.duration,
      (audioProgress) => {
        const progress = clampProgress(15 + audioProgress * 0.3);
        onProgress?.(progress, 'Đang điều chỉnh âm thanh...');
      }
    );

    // Write adjusted audio to filesystem
    await writeFile(adjustedAudioFileName, adjustedAudio.blob);

    onProgress?.(50, 'Đang ghép âm thanh vào video...');

    // Replace audio in video
    // Use -c:v copy to avoid re-encoding video (preserves original quality)
    // Use -map to explicitly select streams
    await exec(
      [
        '-i',
        inputVideoFileName,
        '-i',
        adjustedAudioFileName,
        '-map',
        '0:v', // Video from first input (all video streams)
        '-map',
        '1:a', // Audio from second input (all audio streams)
        '-c:v',
        'copy', // Copy video codec (no re-encoding, preserves quality)
        '-c:a',
        'aac', // Re-encode audio to AAC
        '-b:a',
        '256k', // Higher audio bitrate for better quality (was 128k)
        '-shortest', // Match shortest stream
        outputVideoFileName,
      ],
      (ffmpegProgress) => {
        // FFmpeg progress is 0-1
        const progress = clampProgress(50 + ffmpegProgress.progress * 40);
        onProgress?.(progress, 'Đang ghép âm thanh vào video...');
      }
    );

    onProgress?.(95, 'Đang hoàn tất...');

    // Read output video
    const outputData = await readFile(outputVideoFileName);
    const outputBlob = uint8ArrayToBlob(outputData, mimeType);

    onProgress?.(100, 'Hoàn thành!');

    // Cleanup files
    await deleteFile(inputVideoFileName);
    await deleteFile(adjustedAudioFileName);
    await deleteFile(outputVideoFileName);

    return outputBlob;
  } catch (error) {
    // Cleanup on error
    await deleteFile(inputVideoFileName);
    await deleteFile(adjustedAudioFileName);
    await deleteFile(outputVideoFileName);

    console.error('Error processing video:', error);
    throw error;
  }
};

/**
 * Clamp progress value between 0 and 100
 */
const clampProgress = (progress: number): number => {
  if (!isFinite(progress) || isNaN(progress)) {
    return 0;
  }
  return Math.max(0, Math.min(100, progress));
};

/**
 * Get video file extension from filename
 */
const getVideoExtension = (fileName: string): string => {
  const match = fileName.toLowerCase().match(/\.(mp4|mov|m4v|avi|mkv|webm)$/);
  return match ? match[1] : 'mp4'; // Default to mp4 if no match
};

/**
 * Get video format for FFmpeg output
 */
const getFFmpegFormat = (extension: string): string => {
  const formatMap: Record<string, string> = {
    'mp4': 'mp4',
    'mov': 'mov',
    'm4v': 'mp4',
    'avi': 'avi',
    'mkv': 'matroska',
    'webm': 'webm',
  };
  return formatMap[extension] || 'mp4';
};

/**
 * Concatenate multiple videos into a single video
 */
export const concatenateVideos = async (
  videos: VideoItem[],
  onProgress?: (progress: number, operation: string) => void
): Promise<{ blob: Blob; duration: number; format: string }> => {
  // Use unique filenames with timestamp to avoid conflicts
  const timestamp = Date.now();
  const concatListFileName = `concat_list_${timestamp}.txt`;

  // Detect format from first video
  const videoExtension = getVideoExtension(videos[0].fileName);
  const outputFileName = `concatenated_${timestamp}.${videoExtension}`;
  const mimeType = `video/${videoExtension === 'm4v' ? 'mp4' : videoExtension}`;

  try {
    onProgress?.(5, 'Đang chuẩn bị ghép video...');

    // Write all video files to FFmpeg filesystem with original extensions
    const videoFileNames: string[] = [];
    for (let i = 0; i < videos.length; i++) {
      const ext = getVideoExtension(videos[i].fileName);
      const fileName = `input_${timestamp}_${i}.${ext}`;
      await writeFile(fileName, videos[i].file);
      videoFileNames.push(fileName);

      const progress = clampProgress(5 + (i / videos.length) * 20);
      onProgress?.(progress, `Đang tải video ${i + 1}/${videos.length}...`);
    }

    onProgress?.(25, 'Đang tạo danh sách ghép...');

    // Create concat list file for FFmpeg
    const concatList = videoFileNames.map(name => `file '${name}'`).join('\n');
    const concatListData = new TextEncoder().encode(concatList);
    await writeFile(concatListFileName, concatListData);

    onProgress?.(30, 'Đang ghép video...');

    // Concatenate videos using concat demuxer
    // Use -c copy to avoid re-encoding (preserves original quality)
    await exec(
      [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatListFileName,
        '-c',
        'copy', // Copy all streams without re-encoding (preserves quality)
        outputFileName,
      ],
      (ffmpegProgress) => {
        const progress = clampProgress(30 + ffmpegProgress.progress * 60);
        onProgress?.(progress, 'Đang ghép video...');
      }
    );

    onProgress?.(95, 'Đang hoàn tất...');

    // Read concatenated video
    const outputData = await readFile(outputFileName);
    const outputBlob = uint8ArrayToBlob(outputData, mimeType);

    // Calculate total duration
    const totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);

    onProgress?.(100, 'Ghép video hoàn thành!');

    // Cleanup
    await deleteFile(concatListFileName);
    await deleteFile(outputFileName);
    for (const fileName of videoFileNames) {
      await deleteFile(fileName);
    }

    return { blob: outputBlob, duration: totalDuration, format: videoExtension };
  } catch (error) {
    // Cleanup on error
    await deleteFile(concatListFileName);
    await deleteFile(outputFileName);

    console.error('Error concatenating videos:', error);
    throw error;
  }
};

/**
 * Process multiple videos: concatenate all videos first, then attach audio
 */
export const processVideos = async (
  videos: VideoItem[],
  audioData: YouTubeAudioData,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<ProcessingResult> => {
  const errors: Array<{ videoId: string; error: string }> = [];

  try {
    // Step 1: Concatenate all videos into one
    onProgress?.({
      currentVideo: 1,
      totalVideos: 1,
      currentOperation: 'Đang ghép các video lại...',
      progress: 0,
    });

    const concatenatedVideo = await concatenateVideos(
      videos,
      (progress, operation) => {
        const clampedProgress = clampProgress(progress * 0.5); // First 50% is concatenation
        onProgress?.({
          currentVideo: 1,
          totalVideos: 1,
          currentOperation: operation,
          progress: clampedProgress,
        });
      }
    );

    // Step 2: Attach audio to the concatenated video
    onProgress?.({
      currentVideo: 1,
      totalVideos: 1,
      currentOperation: 'Đang ghép âm thanh...',
      progress: 50,
    });

    // Create a temporary VideoItem for the concatenated video
    const videoFormat = concatenatedVideo.format;
    const mimeType = `video/${videoFormat === 'm4v' ? 'mp4' : videoFormat}`;
    const concatenatedVideoItem: VideoItem = {
      id: 'concatenated',
      file: new File([concatenatedVideo.blob], `concatenated.${videoFormat}`, { type: mimeType }),
      fileName: `concatenated.${videoFormat}`,
      fileSize: concatenatedVideo.blob.size,
      duration: concatenatedVideo.duration,
      thumbnail: videos[0].thumbnail,
      order: 0,
    };

    const processedBlob = await processVideo(
      concatenatedVideoItem,
      audioData,
      videoFormat,
      (videoProgress, operation) => {
        const clampedProgress = clampProgress(50 + videoProgress * 0.5); // Last 50% is audio processing
        onProgress?.({
          currentVideo: 1,
          totalVideos: 1,
          currentOperation: operation,
          progress: clampedProgress,
        });
      }
    );

    // Generate output filename with original format
    const outputFileName = `video_ghep_audio.${videoFormat}`;

    const processedVideos: ProcessedVideo[] = [{
      id: 'final',
      blob: processedBlob,
      fileName: outputFileName,
      originalVideo: concatenatedVideoItem,
    }];

    // Final cleanup
    await cleanup();

    return {
      success: true,
      processedVideos,
      errors: [],
    };
  } catch (error) {
    console.error('Error processing videos:', error);
    errors.push({
      videoId: 'all',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    await cleanup();

    return {
      success: false,
      processedVideos: [],
      errors,
    };
  }
};

/**
 * Estimate processing time based on video size and duration
 */
export const estimateProcessingTime = (videos: VideoItem[]): number => {
  let totalTime = 0;

  for (const video of videos) {
    const sizeInMB = video.fileSize / (1024 * 1024);
    const durationInMinutes = video.duration / 60;

    totalTime += sizeInMB * 0.5 + durationInMinutes * 0.3;
  }

  return Math.ceil(totalTime);
};

/**
 * Check if video format is supported
 */
export const isVideoFormatSupported = (fileName: string): boolean => {
  const supportedFormats = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm'];
  const extension = fileName.toLowerCase().match(/\.[^/.]+$/);

  return extension ? supportedFormats.includes(extension[0]) : false;
};

/**
 * Get estimated output file size
 */
export const estimateOutputSize = (video: VideoItem, audioSize: number): number => {
  // Video size (copied, no re-encoding) + adjusted audio size
  // Audio might be slightly different due to looping/trimming
  const audioDurationRatio = video.duration / 180; // Assume 180s for reference
  const estimatedAudioSize = audioSize * audioDurationRatio;

  return video.fileSize + estimatedAudioSize;
};
