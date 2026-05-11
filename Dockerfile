# Use Node 20
FROM node:20-slim

# Install FFmpeg and Python3
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy rest of the code
COPY . .

# Ensure the app starts
EXPOSE 3000
CMD ["npm", "start"]
