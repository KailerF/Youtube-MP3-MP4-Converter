# YouTube Downloader/Converter

A simple web application to download and convert YouTube videos to MP3 or MP4 formats.

## Prerequisites

- Node.js (v14 or later)
- FFmpeg installed on your system
- yt-dlp installed globally

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/youtube-downloader.git
cd youtube-downloader
```

2. Install dependencies:
```bash
npm install
```

3. Ensure you have FFmpeg installed:
- On Windows: Download from https://ffmpeg.org/download.html and add to PATH
- On macOS: `brew install ffmpeg`
- On Linux: `sudo apt-get install ffmpeg`

4. Install yt-dlp:
```bash
npm install -g yt-dlp-exec
```

## Running the Application

```bash
npm start
```

Open your browser and navigate to `http://localhost:3000`

## Features

- Fetch YouTube video information
- Download videos as MP4 (multiple qualities)
- Download audio as MP3 (multiple bitrates)
- Simple, user-friendly interface

## Important Notes

- Respect YouTube's terms of service
- Only download content you have rights to
- Be aware of copyright restrictions

## Troubleshooting

- Ensure all dependencies are correctly installed
- Check that FFmpeg and yt-dlp are in your system PATH
- Verify you have the latest versions of dependencies
