import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { existsSync } from 'fs';

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

interface YtDlpOptions {
  format?: string;
  dumpSingleJson?: boolean;
  skipDownload?: boolean;
  noWarnings?: boolean;
  noCheckCertificates?: boolean;
  preferFreeFormats?: boolean;
}

export interface VideoFormat {
  url: string;
  ext: string;
  abr?: number;
  vcodec: string;
  resolution: string;
}

export interface VideoInfo {
  title: string;
  duration: number;
  formats: VideoFormat[];
}

export async function executeYtdlp(url: string, options: YtDlpOptions = {}): Promise<VideoInfo> {
  const args: string[] = [url];

  if (options.format) args.push('-f', options.format);
  if (options.dumpSingleJson) args.push('--dump-single-json');
  if (options.skipDownload) args.push('--skip-download');
  if (options.noWarnings) args.push('--no-warnings');
  if (options.noCheckCertificates) args.push('--no-check-certificates');
  if (options.preferFreeFormats) args.push('--prefer-free-formats');

  args.push('--add-header', 'referer:youtube.com');
  args.push('--add-header', 'user-agent:googlebot');

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
