const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

function validateYouTubeURL(url) {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)[a-zA-Z0-9_-]{11}/;
    return regex.test(url);
}

async function getVideoInfo(url) {
    return new Promise((resolve, reject) => {
        const isWin = process.platform === 'win32';
        const ytDlpPath = isWin ? path.join(__dirname, 'yt-dlp.exe') : path.join(__dirname, 'yt-dlp');
        if (!fs.existsSync(ytDlpPath)) {
            return reject(new Error('yt-dlp not found at ' + ytDlpPath));
        }
        const ytDlpCmd = isWin ? ytDlpPath : 'python3';
        const ytDlpArgs = isWin ? ['--verbose', '--dump-json', url] : [ytDlpPath, '--verbose', '--dump-json', url];
        const ytDlp = spawn(ytDlpCmd, ytDlpArgs, { cwd: __dirname });
        let data = '';
        let errorData = '';
        ytDlp.stdout.on('data', (chunk) => {
            data += chunk;
        });
        ytDlp.stderr.on('data', (chunk) => {
            errorData += chunk;
        });
        ytDlp.on('close', (code) => {
            console.log('yt-dlp exit code:', code);
            console.log('yt-dlp stdout:', data);
            console.log('yt-dlp stderr:', errorData);
            if (code === 0 && data.trim()) {
                try {
                    const info = JSON.parse(data);
                    resolve(info);
                } catch (e) {
                    reject(new Error('JSON parse error: ' + e.message));
                }
            } else {
                reject(new Error('yt-dlp failed: ' + errorData || 'No output'));
            }
        });
        ytDlp.on('error', (err) => {
            reject(new Error('Spawn error: ' + err.message));
        });
    });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, process.env.DOWNLOAD_DIR || 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// Utility function to sanitize filename
function sanitizeFilename(filename) {
    return filename.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 200);
}

// Endpoint: Get video info
app.post('/api/info', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || !validateYouTubeURL(url)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid YouTube URL' 
            });
        }

        const info = await getVideoInfo(url);
        const formats = info.formats;

        // Filter and organize video formats
        const videoFormats = formats
            .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
            .map(f => ({
                itag: f.format_id,
                quality: f.resolution || f.format_note,
                container: f.ext,
                codec: f.vcodec + ' / ' + f.acodec,
                filesize: f.filesize,
                fps: f.fps
            }))
            .sort((a, b) => {
                const resA = parseInt(a.quality) || 0;
                const resB = parseInt(b.quality) || 0;
                return resB - resA;
            });

        // Filter audio-only formats
        const audioFormats = formats
            .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
            .map(f => ({
                itag: f.format_id,
                quality: f.abr ? `${f.abr}kbps` : f.format_note,
                container: f.ext,
                codec: f.acodec,
                filesize: f.filesize
            }));

        res.json({
            success: true,
            data: {
                title: info.title,
                author: info.uploader,
                thumbnail: info.thumbnail,
                duration: info.duration,
                description: info.description,
                viewCount: info.view_count,
                videoFormats: videoFormats,
                audioFormats: audioFormats
            }
        });
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to fetch video information. The video might be private, age-restricted, or unavailable.' 
        });
    }
});

// Endpoint: Download video
app.post('/api/download', async (req, res) => {
    try {
        const { url, quality, format } = req.body;

        if (!url || !validateYouTubeURL(url)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid YouTube URL' 
            });
        }

        const info = await getVideoInfo(url);
        const title = sanitizeFilename(info.title);

        res.setHeader('Content-Disposition', `attachment; filename="${title}.${format}"`);

        let ytDlpArgs;
        if (format === 'mp3') {
            ytDlpArgs = ['--verbose', url, '-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3', '-o', '-'];
        } else if (format === 'mp4') {
            let formatStr = 'best';
            if (quality !== 'highest') {
                const height = parseInt(quality);
                if (height) {
                    formatStr = `best[height<=${height}][ext=mp4]`;
                }
            }
            ytDlpArgs = ['--verbose', url, '-f', formatStr, '-o', '-'];
        }

        const isWin = process.platform === 'win32';
        const ytDlpPath = isWin ? path.join(__dirname, 'yt-dlp.exe') : path.join(__dirname, 'yt-dlp');
        if (!fs.existsSync(ytDlpPath)) {
            console.error('yt-dlp not found at', ytDlpPath);
            return res.status(500).json({ success: false, error: 'Server missing yt-dlp binary' });
        }
        const ytDlpCmd = isWin ? ytDlpPath : 'python';
        const ytDlpArgsFinal = isWin ? ytDlpArgs : [ytDlpPath, ...ytDlpArgs];
        const ytDlp = spawn(ytDlpCmd, ytDlpArgsFinal, { cwd: __dirname });
        ytDlp.stdout.pipe(res);

        ytDlp.on('error', (err) => {
            console.error('yt-dlp error:', err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Download failed' });
            }
        });

        ytDlp.stderr.on('data', (data) => {
            console.error('yt-dlp stderr:', data.toString());
        });

    } catch (error) {
        console.error('Error downloading video:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                error: error.message || 'Download failed' 
            });
        }
    }
});

// Endpoint: Validate URL
app.post('/api/validate', (req, res) => {
    const { url } = req.body;
    const isValid = validateYouTubeURL(url);
    res.json({ success: true, valid: isValid });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI-Powered YouTube Downloader running on http://localhost:${PORT}`);
    console.log(`📁 Downloads will be saved to: ${downloadsDir}`);
});
