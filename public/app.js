// Configuration
const API_BASE = window.location.origin;

// State management
let currentVideoInfo = null;
let selectedQuality = 'highest';
let selectedFormat = 'mp4';

// DOM Elements
const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const videoInfoSection = document.getElementById('videoInfo');
const urlError = document.getElementById('urlError');
const downloadBtn = document.getElementById('downloadBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const batchDownloadBtn = document.getElementById('batchDownloadBtn');
const batchUrls = document.getElementById('batchUrls');
const batchProgress = document.getElementById('batchProgress');

// Tab switching
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // Update active tab button
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${targetTab}Tab`).classList.add('active');
        
        // Update selected format
        selectedFormat = targetTab === 'video' ? 'mp4' : 'mp3';
    });
});

// Utility functions
function showError(message) {
    urlError.textContent = message;
    urlError.classList.add('show');
    setTimeout(() => {
        urlError.classList.remove('show');
    }, 5000);
}

function showLoader(button, show) {
    const btnText = button.querySelector('.btn-text');
    const loader = button.querySelector('.loader');
    
    if (show) {
        btnText.style.display = 'none';
        loader.style.display = 'inline-block';
        button.disabled = true;
    } else {
        btnText.style.display = 'inline';
        loader.style.display = 'none';
        button.disabled = false;
    }
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function formatViews(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views;
}

// Fetch video information
async function fetchVideoInfo(url) {
    try {
        showLoader(fetchBtn, true);
        urlError.classList.remove('show');

        const response = await fetch(`${API_BASE}/api/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch video information');
        }

        currentVideoInfo = data.data;
        displayVideoInfo(data.data);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        showLoader(fetchBtn, false);
    }
}

// Display video information
function displayVideoInfo(info) {
    // Set basic info
    document.getElementById('videoTitle').textContent = info.title;
    document.getElementById('channelName').textContent = info.author;
    document.getElementById('duration').textContent = formatDuration(info.duration);
    document.getElementById('views').textContent = formatViews(info.viewCount) + ' views';
    document.getElementById('thumbnail').src = info.thumbnail;

    // Populate video quality options
    const videoQualities = document.getElementById('videoQualities');
    videoQualities.innerHTML = '';

    // Add highest quality option
    const highestBtn = createQualityButton('Highest Available', 'highest');
    videoQualities.appendChild(highestBtn);

    // Add specific quality options
    const uniqueQualities = [...new Set(info.videoFormats.map(f => f.quality))];
    uniqueQualities.forEach(quality => {
        if (quality && quality !== 'highest') {
            const btn = createQualityButton(quality, quality);
            videoQualities.appendChild(btn);
        }
    });

    // Show video info section
    videoInfoSection.style.display = 'block';
    videoInfoSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function createQualityButton(label, quality) {
    const btn = document.createElement('button');
    btn.className = 'quality-btn';
    btn.textContent = label;
    btn.dataset.quality = quality;
    
    if (quality === 'highest') {
        btn.classList.add('selected');
    }
    
    btn.addEventListener('click', () => {
        document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedQuality = quality;
    });
    
    return btn;
}

// Download video
async function downloadVideo() {
    if (!currentVideoInfo) {
        showError('Please fetch video information first');
        return;
    }

    try {
        showLoader(downloadBtn, true);
        progressSection.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Initializing download...';

        const url = urlInput.value.trim();
        
        // Create download request
        const downloadUrl = `${API_BASE}/api/download`;
        const response = await fetch(downloadUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                quality: selectedQuality,
                format: selectedFormat
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Download failed');
        }

        // Simulate progress (since we can't track actual download progress in browser)
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
            progressText.textContent = `Downloading... ${Math.round(progress)}%`;
        }, 500);

        // Get the blob
        const blob = await response.blob();
        clearInterval(progressInterval);

        // Update progress to 100%
        progressFill.style.width = '100%';
        progressText.textContent = 'Download complete! Starting file save...';

        // Create download link
        const downloadLink = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        downloadLink.href = objectUrl;
        
        const fileName = `${currentVideoInfo.title.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 200)}.${selectedFormat}`;
        downloadLink.download = fileName;
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up
        URL.revokeObjectURL(objectUrl);

        progressText.textContent = '✅ File saved successfully!';
        
        setTimeout(() => {
            progressSection.style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error('Download error:', error);
        showError(error.message);
        progressText.textContent = '❌ Download failed';
    } finally {
        showLoader(downloadBtn, false);
    }
}

// Batch download
async function batchDownload() {
    const urls = batchUrls.value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    if (urls.length === 0) {
        showError('Please enter at least one URL');
        return;
    }

    batchProgress.innerHTML = '<h4>Processing batch download...</h4>';
    showLoader(batchDownloadBtn, true);

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const itemDiv = document.createElement('div');
        itemDiv.className = 'batch-item';
        itemDiv.innerHTML = `
            <span>Video ${i + 1}: ${url.substring(0, 50)}...</span>
            <span class="batch-status">⏳ Processing...</span>
        `;
        batchProgress.appendChild(itemDiv);

        try {
            // Validate URL
            const validateResponse = await fetch(`${API_BASE}/api/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const validateData = await validateResponse.json();
            
            if (!validateData.valid) {
                throw new Error('Invalid URL');
            }

            // Fetch info
            const infoResponse = await fetch(`${API_BASE}/api/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const infoData = await infoResponse.json();
            
            if (!infoData.success) {
                throw new Error(infoData.error);
            }

            // Download
            const downloadResponse = await fetch(`${API_BASE}/api/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    quality: 'highest',
                    format: 'mp4'
                })
            });

            if (!downloadResponse.ok) {
                throw new Error('Download failed');
            }

            const blob = await downloadResponse.blob();
            const downloadLink = document.createElement('a');
            const objectUrl = URL.createObjectURL(blob);
            downloadLink.href = objectUrl;
            downloadLink.download = `${infoData.data.title}.mp4`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(objectUrl);

            itemDiv.querySelector('.batch-status').textContent = '✅ Downloaded';
            itemDiv.querySelector('.batch-status').classList.add('success');

        } catch (error) {
            console.error(`Error downloading ${url}:`, error);
            itemDiv.querySelector('.batch-status').textContent = `❌ ${error.message}`;
            itemDiv.querySelector('.batch-status').classList.add('error');
        }

        // Add delay between downloads
        if (i < urls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    showLoader(batchDownloadBtn, false);
}

// Event listeners
fetchBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
        showError('Please enter a YouTube URL');
        return;
    }
    fetchVideoInfo(url);
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchBtn.click();
    }
});

downloadBtn.addEventListener('click', downloadVideo);
batchDownloadBtn.addEventListener('click', batchDownload);

// Auto-focus on input
urlInput.focus();

// Add paste event listener for convenience
urlInput.addEventListener('paste', (e) => {
    setTimeout(() => {
        const url = urlInput.value.trim();
        if (url) {
            // Auto-trigger fetch after paste (optional UX enhancement)
            // Uncomment the next line to enable auto-fetch on paste
            // fetchVideoInfo(url);
        }
    }, 100);
});
