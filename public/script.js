document.addEventListener('DOMContentLoaded', () => {
    const videoUrlInput = document.getElementById('videoUrl');
    const getInfoBtn = document.getElementById('getInfoBtn');
    const videoInfo = document.getElementById('videoInfo');
    const videoTitle = document.getElementById('videoTitle');
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoDetails = document.getElementById('videoDetails');
    const mp3Btn = document.getElementById('mp3Btn');
    const mp4Btn = document.getElementById('mp4Btn');
    const statusDiv = document.getElementById('status');
    const mp3QualitySelect = document.getElementById('mp3Quality');
    const mp4QualitySelect = document.getElementById('mp4Quality');

    let currentVideoUrl = '';

    // Reset UI
    function resetUI() {
        videoInfo.classList.add('hidden');
        statusDiv.textContent = '';
        statusDiv.classList.remove('error', 'success');
    }

    // Display status message
    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.classList.toggle('error', isError);
        statusDiv.classList.toggle('success', !isError);
    }

    // Get video info
    getInfoBtn.addEventListener('click', async () => {
        resetUI();
        currentVideoUrl = videoUrlInput.value.trim();

        if (!currentVideoUrl) {
            showStatus('Please enter a valid YouTube URL', true);
            return;
        }

        try {
            showStatus('Fetching video information...');
            const response = await fetch(`/api/info?url=${encodeURIComponent(currentVideoUrl)}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch video info');
            }

            const data = await response.json();
            
            // Update video info
            videoTitle.textContent = data.title;
            videoThumbnail.src = data.thumbnail;
            videoDetails.textContent = `Duration: ${formatDuration(data.duration)} | Uploader: ${data.author}`;
            
            // Show video info section
            videoInfo.classList.remove('hidden');
            showStatus('Video information retrieved successfully', false);
        } catch (error) {
            showStatus(`Error: ${error.message}`, true);
            console.error('Error:', error);
        }
    });

    // MP3 Download
    mp3Btn.addEventListener('click', async () => {
        const quality = mp3QualitySelect.value;
        
        try {
            showStatus('Preparing MP3 download...');
            
            // Start download
            window.location.href = `/api/convert/mp3?url=${encodeURIComponent(currentVideoUrl)}&quality=${quality}`;
            
            showStatus('MP3 download started. Check your downloads folder.', false);
        } catch (error) {
            showStatus(`MP3 Download Error: ${error.message}`, true);
            console.error('MP3 Download Error:', error);
        }
    });

    // MP4 Download
    mp4Btn.addEventListener('click', async () => {
        const quality = mp4QualitySelect.value;
        
        try {
            showStatus('Preparing MP4 download...');
            
            // Start download
            window.location.href = `/api/convert/mp4?url=${encodeURIComponent(currentVideoUrl)}&quality=${quality}`;
            
            showStatus('MP4 download started. Check your downloads folder.', false);
        } catch (error) {
            showStatus(`MP4 Download Error: ${error.message}`, true);
            console.error('MP4 Download Error:', error);
        }
    });

    // Utility function to format duration
    function formatDuration(seconds) {
        if (!seconds) return 'Unknown';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
});