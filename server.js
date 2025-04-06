const express = require('express');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ytdlp = require('yt-dlp-exec');
const app = express();
const PORT = 3000;

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API endpoint for video info
app.get('/api/info', async (req, res) => {
  try {
    const videoURL = req.query.url;
    if (!videoURL) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const info = await ytdlp(videoURL, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      noCheckCertificates: true,
      noCallHome: true,
    });

    return res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      author: info.uploader
    });
  } catch (error) {
    console.error('Error fetching video info:', error);
    return res.status(500).json({ error: 'Failed to get video info' });
  }
});

// Convert to MP3 (pure MP3 implementation)
app.get('/api/convert/mp3', async (req, res) => {
  try {
    const videoURL = req.query.url;
    const quality = req.query.quality || '128';
    
    if (!videoURL) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    console.log('Starting MP3 conversion for URL:', videoURL);

    // Generate a safe filename
    const info = await ytdlp(videoURL, { dumpSingleJson: true });
    const safeTitle = info.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    const fileName = `${safeTitle}-${Date.now()}.mp3`;
    const filePath = path.join(downloadsDir, fileName);

    console.log('Will save MP3 to:', filePath);

    // Download audio in a format ffmpeg can handle well
    const tempFilePath = path.join(downloadsDir, `temp-${Date.now()}.m4a`);
    
    console.log('Downloading audio to temp file:', tempFilePath);
    
    await ytdlp(videoURL, {
      output: tempFilePath,
      extractAudio: true,
      audioFormat: 'm4a',  // Explicitly use m4a instead of 'best'
      audioQuality: 0,     // Best quality
      noCheckCertificates: true,
      noCallHome: true,
    });

    console.log('Audio download complete, converting to MP3');

    // Convert to pure MP3 with explicit codec settings
    ffmpeg(tempFilePath)
      .audioCodec('libmp3lame')           // Explicitly use the MP3 codec
      .audioBitrate(parseInt(quality))    // Set the requested quality
      .audioChannels(2)                   // Stereo
      .audioFrequency(44100)              // CD quality
      .format('mp3')                      // Ensure MP3 format
      .outputOptions([
        '-id3v2_version', '3',            // Add ID3 tags
        '-write_id3v1', '1'               // Ensure ID3v1 tags are written
      ])
      .on('start', (commandLine) => {
        console.log('FFmpeg started with command:', commandLine);
      })
      .on('progress', (progress) => {
        console.log('FFmpeg progress:', progress.percent, '% done');
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        res.status(500).json({ error: 'MP3 conversion failed' });
      })
      .on('end', () => {
        console.log('FFmpeg finished, MP3 conversion complete');
        
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log('Temp file deleted');
        }
        
        // Verify the file exists and check its format
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          console.log('MP3 file created, size:', stats.size, 'bytes');
          
          // Send the file without deleting it afterward
          res.download(filePath, fileName, (err) => {
            if (err) {
              console.error('Download error:', err);
            } else {
              console.log('MP3 file download initiated');
            }
          });
        } else {
          console.error('MP3 file not found after conversion');
          res.status(500).json({ error: 'MP3 file not found after conversion' });
        }
      })
      .save(filePath);
  } catch (error) {
    console.error('Error in MP3 conversion:', error);
    res.status(500).json({ error: 'MP3 conversion failed: ' + error.message });
  }
});

// Convert to MP4 - Direct approach
app.get('/api/convert/mp4', async (req, res) => {
  try {
    const videoURL = req.query.url;
    const quality = req.query.quality || '360';
    
    if (!videoURL) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    // Generate a safe filename
    const info = await ytdlp(videoURL, { dumpSingleJson: true });
    const safeTitle = info.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    const fileName = `${safeTitle}-${Date.now()}.mp4`;
    const filePath = path.join(downloadsDir, fileName);

    // Map quality to format
    let formatHeight;
    switch(quality) {
      case '1080': formatHeight = 1080; break;
      case '720': formatHeight = 720; break;
      case '480': formatHeight = 480; break;
      default: formatHeight = 360; break;
    }

    console.log('Starting MP4 download to:', filePath);

    // Use yt-dlp directly with the appropriate format and output options
    await ytdlp(videoURL, {
      output: filePath,
      format: `bestvideo[height<=${formatHeight}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${formatHeight}][ext=mp4]`,
      mergeOutputFormat: 'mp4',
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'],
      noCheckCertificates: true,
      noCallHome: true,
      embedMetadata: true,
      embedThumbnail: false,
      embedSubs: false,
    });

    console.log('MP4 download complete, checking file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('MP4 file does not exist after download');
      return res.status(500).json({ error: 'MP4 file not found after download' });
    }

    console.log('MP4 file exists, size:', fs.statSync(filePath).size);

    // Send the file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('MP4 download error:', err);
      } else {
        console.log('MP4 file download initiated');
      }
      // File deletion code removed
    });
  } catch (error) {
    console.error('Error converting to MP4:', error.message, error.stack);
    res.status(500).json({ error: 'MP4 conversion failed: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});