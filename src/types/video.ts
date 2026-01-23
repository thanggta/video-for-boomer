export interface VideoItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  duration: number;
  thumbnail: string;
  order: number;
  processed?: Blob;
  error?: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  metadata?: VideoMetadata;
}
