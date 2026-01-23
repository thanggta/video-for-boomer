import { create } from 'zustand';
import { VideoItem } from '@/types/video';
import { ProcessingStatus } from '@/types/processing';
import { YouTubeAudioData } from '@/types/youtube';

export interface ProcessedVideo {
  id: string;
  blob: Blob;
  fileName: string;
  originalVideo: VideoItem;
}

interface VideoStore {
  // Navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Videos
  videos: VideoItem[];
  addVideo: (video: VideoItem) => void;
  removeVideo: (id: string) => void;
  updateVideo: (id: string, updates: Partial<VideoItem>) => void;
  moveVideoUp: (id: string) => void;
  moveVideoDown: (id: string) => void;
  clearVideos: () => void;

  // YouTube Audio
  youtubeAudio: YouTubeAudioData | null;
  setYoutubeAudio: (audio: YouTubeAudioData | null) => void;

  // Processing
  processingStatus: ProcessingStatus;
  setProcessingStatus: (status: ProcessingStatus) => void;
  currentProcessingIndex: number;
  setCurrentProcessingIndex: (index: number) => void;

  // Processed Videos
  processedVideos: ProcessedVideo[];
  setProcessedVideos: (videos: ProcessedVideo[]) => void;
  clearProcessedVideos: () => void;

  // Reset
  reset: () => void;
}

const useVideoStore = create<VideoStore>((set) => ({
  // Navigation
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(5, state.currentStep + 1) })),
  previousStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

  // Videos
  videos: [],
  addVideo: (video) =>
    set((state) => ({
      videos: [...state.videos, { ...video, order: state.videos.length + 1 }],
    })),
  removeVideo: (id) =>
    set((state) => ({
      videos: state.videos
        .filter((v) => v.id !== id)
        .map((v, index) => ({ ...v, order: index + 1 })),
    })),
  updateVideo: (id, updates) =>
    set((state) => ({
      videos: state.videos.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),
  moveVideoUp: (id) =>
    set((state) => {
      const index = state.videos.findIndex((v) => v.id === id);
      if (index <= 0) return state;

      const newVideos = [...state.videos];
      [newVideos[index - 1], newVideos[index]] = [newVideos[index], newVideos[index - 1]];

      return {
        videos: newVideos.map((v, i) => ({ ...v, order: i + 1 })),
      };
    }),
  moveVideoDown: (id) =>
    set((state) => {
      const index = state.videos.findIndex((v) => v.id === id);
      if (index === -1 || index >= state.videos.length - 1) return state;

      const newVideos = [...state.videos];
      [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];

      return {
        videos: newVideos.map((v, i) => ({ ...v, order: i + 1 })),
      };
    }),
  clearVideos: () => set({ videos: [] }),

  // YouTube Audio
  youtubeAudio: null,
  setYoutubeAudio: (audio) => set({ youtubeAudio: audio }),

  // Processing
  processingStatus: 'idle',
  setProcessingStatus: (status) => set({ processingStatus: status }),
  currentProcessingIndex: 0,
  setCurrentProcessingIndex: (index) => set({ currentProcessingIndex: index }),

  // Processed Videos
  processedVideos: [],
  setProcessedVideos: (videos) => set({ processedVideos: videos }),
  clearProcessedVideos: () => set({ processedVideos: [] }),

  // Reset
  reset: () =>
    set({
      currentStep: 1,
      videos: [],
      youtubeAudio: null,
      processingStatus: 'idle',
      currentProcessingIndex: 0,
      processedVideos: [],
    }),
}));

export default useVideoStore;
