# GhepVideo

Ứng dụng web di động giúp người cao tuổi Việt Nam dễ dàng thay đổi âm thanh trong video với nhạc từ YouTube.

## Tính năng chính

- 📱 **Tối ưu cho mobile**: Thiết kế dành riêng cho điện thoại
- 👴 **Dễ sử dụng**: Giao diện đơn giản cho người cao tuổi
- 🇻🇳 **Tiếng Việt**: 100% giao diện tiếng Việt
- 💰 **Miễn phí**: Xử lý hoàn toàn trên trình duyệt, không tốn chi phí server
- 🎵 **YouTube Integration**: Tải âm thanh từ YouTube
- 📹 **Xử lý nhiều video**: Hỗ trợ upload và xử lý nhiều video cùng lúc

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Video Processing**: FFmpeg.wasm (client-side)
- **State Management**: Zustand
- **Styling**: Tailwind CSS (elderly-friendly theme)
- **Deployment**: Vercel (free tier)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── steps/       # Step-by-step workflow components
│   └── ui/          # Reusable UI components
├── lib/             # Core business logic
│   ├── ffmpeg/      # Video processing with FFmpeg.wasm
│   ├── youtube/     # YouTube audio extraction
│   ├── storage/     # IndexedDB persistence
│   └── utils/       # Utility functions
├── store/           # Zustand state management
├── types/           # TypeScript type definitions
└── config/          # Configuration constants
```

## Development Roadmap

- [x] Day 1: Project Setup
- [ ] Day 2: Design System
- [ ] Day 3: Core UI Shell
- [ ] Day 4-5: Video Upload
- [ ] Day 6-7: YouTube Integration
- [ ] Day 8-10: FFmpeg Integration
- [ ] Day 11-12: Processing Workflow
- [ ] Day 13: Download System
- [ ] Day 14-15: Testing & Polish
- [ ] Day 16: User Testing
- [ ] Day 17: Deployment

## Features

### Workflow

1. **Upload Videos**: Upload multiple MOV files (max 500MB, 15 min each)
2. **Reorder**: Sort videos using large ↑/↓ buttons
3. **YouTube Audio**: Input YouTube URL and download audio
4. **Process**: Automatically adjust audio duration and merge with videos
5. **Download**: Download individual videos or batch download as ZIP

### Accessibility Features

- Large touch targets (60x60px minimum)
- Large fonts (20px base size)
- High contrast colors (4.5:1 ratio)
- Simple linear navigation
- Vietnamese-only interface
- Clear error messages

## License

MIT

## Contact

For support or questions, please open an issue on GitHub.
