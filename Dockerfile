FROM node:20

# Install curl
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and download script
COPY package*.json download-yt-dlp.js ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create downloads directory
RUN mkdir -p downloads

# Expose port
EXPOSE 3000

# Set environment variable
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
