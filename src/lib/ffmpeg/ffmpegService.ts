import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;
let loadError: Error | null = null;

export interface FFmpegLoadConfig {
  coreURL?: string;
  wasmURL?: string;
  workerURL?: string;
}

/**
 * Initialize FFmpeg.wasm with lazy loading
 * Attempts to use multi-threading if SharedArrayBuffer is available
 */
export const loadFFmpeg = async (
  onProgress?: (progress: number) => void
): Promise<FFmpeg> => {
  // Return existing instance if already loaded
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  // Wait if already loading
  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (ffmpegInstance && ffmpegInstance.loaded) {
      return ffmpegInstance;
    }
  }

  // Throw previous load error if exists
  if (loadError) {
    throw loadError;
  }

  isLoading = true;
  loadError = null;

  try {
    const ffmpeg = new FFmpeg();

    // Set up progress listener
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });
    }

    // Log FFmpeg messages for debugging
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    onProgress?.(10);

    // Check if SharedArrayBuffer is available (for multi-threading)
    const supportsSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

    // Load FFmpeg core files from local node_modules
    // Next.js requires static paths with new URL() - must use UMD version (not ESM)
    // Webpack will bundle these files automatically
    console.log('Multi-threaded mode:', supportsSharedArrayBuffer);

    if (supportsSharedArrayBuffer) {
      // Multi-threaded mode (faster) - use @ffmpeg/core-mt
      console.log('Loading FFmpeg in multi-threaded mode');

      const coreURL = new URL(
        '../../../node_modules/@ffmpeg/core-mt/dist/umd/ffmpeg-core.js',
        import.meta.url
      ).href;
      const wasmURL = new URL(
        '../../../node_modules/@ffmpeg/core-mt/dist/umd/ffmpeg-core.wasm',
        import.meta.url
      ).href;
      const workerURL = new URL(
        '../../../node_modules/@ffmpeg/core-mt/dist/umd/ffmpeg-core.worker.js',
        import.meta.url
      ).href;

      await ffmpeg.load({
        coreURL,
        wasmURL,
        workerURL,
      });
    } else {
      // Single-threaded mode (iOS Safari fallback) - use @ffmpeg/core
      console.log('Loading FFmpeg in single-threaded mode');

      const coreURL = new URL(
        '../../../node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js',
        import.meta.url
      ).href;
      const wasmURL = new URL(
        '../../../node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm',
        import.meta.url
      ).href;

      await ffmpeg.load({
        coreURL,
        wasmURL,
      });
    }

    onProgress?.(100);

    ffmpegInstance = ffmpeg;
    isLoading = false;
    console.log('FFmpeg loaded successfully');
    return ffmpeg;
  } catch (error) {
    isLoading = false;
    loadError = error instanceof Error ? error : new Error('Failed to load FFmpeg');
    console.error('Error loading FFmpeg:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    throw loadError;
  }
};

/**
 * Get the FFmpeg instance (must be loaded first)
 */
export const getFFmpeg = (): FFmpeg => {
  if (!ffmpegInstance || !ffmpegInstance.loaded) {
    throw new Error('FFmpeg not loaded. Call loadFFmpeg() first.');
  }
  return ffmpegInstance;
};

/**
 * Check if FFmpeg is loaded
 */
export const isFFmpegLoaded = (): boolean => {
  return ffmpegInstance !== null && ffmpegInstance.loaded;
};

/**
 * Write a file to FFmpeg virtual filesystem
 */
export const writeFile = async (
  fileName: string,
  data: Uint8Array | Blob | string
): Promise<void> => {
  const ffmpeg = getFFmpeg();

  if (data instanceof Blob || typeof data === 'string') {
    const fileData = await fetchFile(data);
    await ffmpeg.writeFile(fileName, fileData);
  } else {
    await ffmpeg.writeFile(fileName, data);
  }
};

/**
 * Read a file from FFmpeg virtual filesystem
 */
export const readFile = async (fileName: string): Promise<Uint8Array> => {
  const ffmpeg = getFFmpeg();
  const data = await ffmpeg.readFile(fileName);

  if (data instanceof Uint8Array) {
    return data;
  }

  throw new Error('Unexpected file data type');
};

/**
 * Delete a file from FFmpeg virtual filesystem
 */
export const deleteFile = async (fileName: string): Promise<void> => {
  const ffmpeg = getFFmpeg();
  try {
    await ffmpeg.deleteFile(fileName);
  } catch (error) {
    // Ignore if file doesn't exist
    console.warn(`Could not delete file ${fileName}:`, error);
  }
};

/**
 * List files in FFmpeg virtual filesystem
 */
export const listFiles = async (): Promise<string[]> => {
  const ffmpeg = getFFmpeg();
  const files = await ffmpeg.listDir('/');
  return files.map(f => f.name);
};

/**
 * Execute FFmpeg command
 */
export const exec = async (
  args: string[],
  onProgress?: (progress: { progress: number; time: number }) => void
): Promise<void> => {
  const ffmpeg = getFFmpeg();

  if (onProgress) {
    const progressHandler = (data: { progress: number; time: number }) => {
      onProgress(data);
    };
    ffmpeg.on('progress', progressHandler);

    try {
      await ffmpeg.exec(args);
    } finally {
      ffmpeg.off('progress', progressHandler);
    }
  } else {
    await ffmpeg.exec(args);
  }
};

/**
 * Clean up FFmpeg virtual filesystem
 * Deletes all files to free memory
 */
export const cleanup = async (): Promise<void> => {
  const ffmpeg = getFFmpeg();
  try {
    const files = await ffmpeg.listDir('/');
    for (const file of files) {
      if (file.name && file.name !== '.' && file.name !== '..') {
        try {
          await ffmpeg.deleteFile(file.name);
        } catch (error) {
          console.warn(`Could not delete file ${file.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn('Error during cleanup:', error);
  }
};

/**
 * Convert Uint8Array to Blob
 */
export const uint8ArrayToBlob = (data: Uint8Array, mimeType: string): Blob => {
  // Create a copy to ensure compatibility with Blob constructor
  const buffer = new Uint8Array(data);
  return new Blob([buffer], { type: mimeType });
};

/**
 * Get video duration using FFmpeg
 */
export const getVideoDuration = async (videoBlob: Blob): Promise<number> => {
  const ffmpeg = getFFmpeg();

  const inputFileName = 'input_duration.mp4';

  try {
    await writeFile(inputFileName, videoBlob);

    // Use ffprobe command to get duration
    // Note: This is a simplified version, actual implementation may vary
    await exec(['-i', inputFileName, '-f', 'null', '-']);

    // Parse duration from logs (this is a placeholder)
    // In practice, you might need to extract this from FFmpeg output

    await deleteFile(inputFileName);

    return 0; // Placeholder
  } catch (error) {
    await deleteFile(inputFileName);
    throw error;
  }
};

/**
 * Check if SharedArrayBuffer is available
 */
export const supportsSharedArrayBuffer = (): boolean => {
  return typeof SharedArrayBuffer !== 'undefined';
};

/**
 * Check if browser supports FFmpeg
 */
export const isBrowserSupported = (): boolean => {
  // Check for required APIs
  return (
    typeof WebAssembly !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof Blob !== 'undefined'
  );
};
