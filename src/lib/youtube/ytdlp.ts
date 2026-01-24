import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { existsSync, writeFileSync, unlinkSync } from 'fs';

const execAsync = promisify(exec);

function findPythonPath(): string {
  const candidates = [
    process.env.PYTHON_PATH,
    '/opt/homebrew/bin/python3.14',
    '/opt/homebrew/bin/python3',
    '/usr/local/bin/python3',
    '/usr/bin/python3',
    'python3',
  ];

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  return 'python3';
}

const PYTHON_PATH = findPythonPath();
const YTDLP_PATH = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp');
const COOKIES_PATH = path.join('/tmp', 'youtube-cookies.txt');

interface YtDlpOptions {
  format?: string;
  dumpSingleJson?: boolean;
  skipDownload?: boolean;
  noWarnings?: boolean;
  noCheckCertificates?: boolean;
  preferFreeFormats?: boolean;
  simulateOnly?: boolean;
  noCheckFormats?: boolean;
}

export interface VideoFormat {
  url: string;
  ext: string;
  abr?: number;
  asr?: number; // Audio sample rate
  vcodec: string;
  acodec?: string; // Audio codec (opus, mp4a, etc.)
  resolution: string;
  format_note?: string; // Format description (e.g., "medium", "low")
  filesize?: number; // File size in bytes
}

export interface VideoInfo {
  title: string;
  duration: number;
  formats: VideoFormat[];
}

export async function executeYtdlp(url: string, options: YtDlpOptions = {}): Promise<VideoInfo> {
  const args: string[] = [url];

  if (options.dumpSingleJson) args.push('--dump-single-json');
  if (options.skipDownload) args.push('--skip-download');
  if (options.simulateOnly) args.push('--simulate');
  if (options.noWarnings) args.push('--no-warnings');
  if (options.noCheckCertificates) args.push('--no-check-certificates');
  if (options.noCheckFormats) args.push('--no-check-formats');
  if (options.preferFreeFormats) args.push('--prefer-free-formats');
  if (options.format) args.push('-f', options.format);

  let cookiesFileCreated = false;

  // Priority 1: Use --cookies-from-browser if specified (MOST RELIABLE)
  if (process.env.YOUTUBE_COOKIES_BROWSER) {
    const browser = process.env.YOUTUBE_COOKIES_BROWSER.toLowerCase();
    console.log(`Using cookies from browser: ${browser}`);
    args.push('--cookies-from-browser', browser);
  }
  // Priority 2: Use cookie file from YOUTUBE_COOKIES env variable (FALLBACK)
  else if (process.env.YOUTUBE_COOKIES) {
    try {
      const cookiesContent = process.env.YOUTUBE_COOKIES.trim();
      writeFileSync(COOKIES_PATH, cookiesContent, { encoding: 'utf8', mode: 0o600 });

      const lines = cookiesContent.split('\n').filter(l => !l.startsWith('#') && l.trim());
      console.log(`Using cookies from YOUTUBE_COOKIES env variable (${lines.length} cookie entries)`);

      // Warn if cookie count is suspiciously low
      if (lines.length < 15) {
        console.warn('⚠️  WARNING: Only', lines.length, 'cookie entries found. YouTube typically requires 15+ cookies from a logged-in session.');
        console.warn('⚠️  This may cause "Sign in to confirm you\'re not a bot" errors.');
        console.warn('⚠️  Make sure you exported cookies while LOGGED IN to YouTube. See YOUTUBE_COOKIES_SETUP.md');
      }

      args.push('--cookies', COOKIES_PATH);
      cookiesFileCreated = true;
    } catch (error) {
      console.warn('Failed to write cookies file:', error);
    }
  }

  args.push('--add-header', 'referer:youtube.com');
  args.push('--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const command = `"${PYTHON_PATH}" "${YTDLP_PATH}" ${args.map(a => `"${a}"`).join(' ')}`;

  try {
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 60000,
      windowsHide: true,
    });

    if (stderr) {
      console.warn('yt-dlp stderr:', stderr);
    }

    return JSON.parse(stdout) as VideoInfo;
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string; code?: string };

    if (err.code === 'ENOENT') {
      throw new Error('yt-dlp or Python not found. Please install dependencies.');
    }

    throw new Error(err.stderr || err.message || 'yt-dlp execution failed');
  } finally {
    if (cookiesFileCreated) {
      try {
        unlinkSync(COOKIES_PATH);
      } catch (error) {
        console.warn('Failed to cleanup cookies file:', error);
      }
    }
  }
}

export async function downloadAudioWithYtdlp(url: string): Promise<{ buffer: Buffer; duration: number }> {
  const { randomBytes } = await import('crypto');
  const { readFileSync } = await import('fs');
  const outputTemplate = path.join('/tmp', `yt-audio-${randomBytes(8).toString('hex')}.mp3`);

  const args: string[] = [
    url,
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '6',
    '-f', 'worstaudio[abr<=96]/worstaudio/bestaudio[abr<=96]/worst',
    '--no-warnings',
    '--no-check-certificates',
    '--no-playlist',
    '-o', outputTemplate,
  ];

  let cookiesFileCreated = false;

  if (process.env.YOUTUBE_COOKIES_BROWSER) {
    const browser = process.env.YOUTUBE_COOKIES_BROWSER.toLowerCase();
    args.push('--cookies-from-browser', browser);
  } else if (process.env.YOUTUBE_COOKIES) {
    try {
      const cookiesContent = process.env.YOUTUBE_COOKIES.trim();
      writeFileSync(COOKIES_PATH, cookiesContent, { encoding: 'utf8', mode: 0o600 });
      args.push('--cookies', COOKIES_PATH);
      cookiesFileCreated = true;
    } catch (error) {
      console.warn('Failed to write cookies file:', error);
    }
  }

  args.push('--add-header', 'referer:youtube.com');
  args.push('--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const command = `"${PYTHON_PATH}" "${YTDLP_PATH}" ${args.map(a => `"${a}"`).join(' ')}`;

  try {
    console.log('Downloading and extracting audio with yt-dlp...');

    await execAsync(command, {
      maxBuffer: 100 * 1024 * 1024,
      timeout: 180000,
      windowsHide: true,
    });

    if (!existsSync(outputTemplate)) {
      throw new Error('yt-dlp did not produce output file');
    }

    console.log(`Audio extracted to: ${outputTemplate}`);

    const videoInfo = await executeYtdlp(url, {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
    });

    const buffer = readFileSync(outputTemplate);

    return {
      buffer,
      duration: videoInfo.duration || 0,
    };
  } catch (error) {
    console.error('yt-dlp error:', error);
    throw error;
  } finally {
    if (existsSync(outputTemplate)) {
      try {
        unlinkSync(outputTemplate);
      } catch (error) {
        console.warn('Failed to cleanup audio file:', error);
      }
    }
    if (cookiesFileCreated) {
      try {
        unlinkSync(COOKIES_PATH);
      } catch (error) {
        console.warn('Failed to cleanup cookies file:', error);
      }
    }
  }
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#\s]+)/,
    /youtube\.com\/shorts\/([^&\n?#\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

export function cleanYouTubeUrl(url: string): string {
  return url.split('&list=')[0].split('?list=')[0];
}
