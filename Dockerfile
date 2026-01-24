# Use Node.js 20 as base image (required by @distube/ytdl-core)
FROM node:20-slim

# Install Python 3, Deno (for yt-dlp JS challenges), and required system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Deno (JavaScript runtime required by yt-dlp for YouTube downloads)
# Deno is recommended by yt-dlp for solving YouTube's JavaScript challenges
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="$DENO_INSTALL/bin:$PATH"

# Upgrade pip and install yt-dlp with EJS support
# The [default] extra includes yt-dlp-ejs which contains JavaScript challenge solvers
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install --upgrade "yt-dlp[default]"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

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
