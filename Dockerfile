# Use Node.js 20 as base image (required by @distube/ytdl-core)
FROM node:20-slim

# Install Python 3, Deno (for yt-dlp JS challenges), and required system dependencies
# Including build dependencies for yt-dlp[default] packages (pycryptodomex, brotli, etc.)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    curl \
    unzip \
    ca-certificates \
    libffi-dev \
    libssl-dev \
    zlib1g-dev \
    rustc \
    cargo \
    && rm -rf /var/lib/apt/lists/*

# Install Deno (JavaScript runtime required by yt-dlp for YouTube downloads)
# Deno is recommended by yt-dlp for solving YouTube's JavaScript challenges
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

# Upgrade pip and install yt-dlp with default extras
# The [default] extra includes packages for handling various formats and encryption
# Using --break-system-packages is safe in Docker containers (isolated environment)
RUN python3 -m pip install --no-cache-dir --upgrade pip --break-system-packages && \
    python3 -m pip install --no-cache-dir --upgrade "yt-dlp[default]" --break-system-packages

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Skip postinstall scripts to avoid GitHub API rate limits (we install yt-dlp separately via Python)
RUN npm install --ignore-scripts

# Manually create the youtube-dl-exec binary directory and symlink to our yt-dlp installation
# This allows youtube-dl-exec to use our Python yt-dlp instead of downloading its own binary
RUN mkdir -p node_modules/youtube-dl-exec/bin && \
    ln -sf $(which yt-dlp) node_modules/youtube-dl-exec/bin/yt-dlp || true

# Copy the rest of the application
COPY . .

# Build Next.js app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]
