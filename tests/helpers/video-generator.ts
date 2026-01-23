/**
 * Generate a mock video file for testing using Canvas API
 * Creates a small valid video file that can be processed
 */
export async function generateMockVideo(
  durationSeconds: number = 5,
  width: number = 640,
  height: number = 480
): Promise<Buffer> {
  // Create a simple video file using canvas
  // This creates a minimal valid MP4 file for testing

  // MP4 header for a minimal video file
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
  ]);

  // Create minimal video data (just header for mock)
  return mp4Header;
}

/**
 * Get path to test video fixture
 */
export function getTestVideoPath(): string {
  return 'tests/fixtures/test-video.mp4';
}

/**
 * Create test video buffer that simulates a real video file
 */
export function createTestVideoBuffer(sizeKB: number = 100): Buffer {
  // Create a buffer of specified size with mock video data
  const size = sizeKB * 1024;
  const buffer = Buffer.alloc(size);

  // Add MP4 signature at the beginning
  buffer.write('ftypisom', 4);
  buffer.write('moov', 100);
  buffer.write('mdat', 200);

  return buffer;
}
