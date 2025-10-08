const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
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

        if (!url || !ytdl.validateURL(url)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid YouTube URL' 
            });
        }

        const info = await ytdl.getInfo(url);
        const formats = info.formats;

        // Filter and organize video formats
        const videoFormats = formats
            .filter(f => f.hasVideo && f.hasAudio)
            .map(f => ({
                itag: f.itag,
                quality: f.qualityLabel || f.quality,
                container: f.container,
                codec: f.codecs,
                filesize: f.contentLength,
                fps: f.fps
            }))
            .sort((a, b) => {
                const qualityOrder = { '144p': 1, '240p': 2, '360p': 3, '480p': 4, '720p': 5, '1080p': 6, '1440p': 7, '2160p': 8, '4320p': 9 };
                return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
            });

        // Filter audio-only formats
        const audioFormats = formats
            .filter(f => f.hasAudio && !f.hasVideo)
            .map(f => ({
                itag: f.itag,
                quality: f.audioBitrate ? `${f.audioBitrate}kbps` : 'audio',
                container: f.container,
                codec: f.codecs,
                filesize: f.contentLength
            }));

        res.json({
            success: true,
            data: {
                title: info.videoDetails.title,
                author: info.videoDetails.author.name,
                thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
                duration: info.videoDetails.lengthSeconds,
                description: info.videoDetails.description,
                viewCount: info.videoDetails.viewCount,
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

        if (!url || !ytdl.validateURL(url)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid YouTube URL' 
            });
        }

        const info = await ytdl.getInfo(url);
        const title = sanitizeFilename(info.videoDetails.title);

        res.setHeader('Content-Disposition', `attachment; filename="${title}.${format}"`);

        if (format === 'mp3') {
            // Audio-only download with conversion to MP3
            const audioStream = ytdl(url, { 
                quality: 'highestaudio',
                filter: 'audioonly'
            });

            ffmpeg(audioStream)
                .audioBitrate(128)
                .format('mp3')
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    if (!res.headersSent) {
                        res.status(500).json({ success: false, error: 'Conversion failed' });
                    }
                })
                .pipe(res, { end: true });

        } else if (format === 'mp4') {
            // Video download with specific quality
            let videoStream;
            
            if (quality === 'highest') {
                videoStream = ytdl(url, { quality: 'highest' });
            } else {
                const formats = info.formats.filter(f => 
                    f.qualityLabel === quality && f.hasVideo && f.hasAudio
                );
                
                if (formats.length > 0) {
                    videoStream = ytdl(url, { quality: formats[0].itag });
                } else {
                    // Fallback to merging video and audio
                    const videoOnly = ytdl(url, { 
                        quality: 'highestvideo',
                        filter: format => format.qualityLabel === quality 
                    });
                    const audioOnly = ytdl(url, { 
                        quality: 'highestaudio',
                        filter: 'audioonly'
                    });

                    ffmpeg()
                        .input(videoOnly)
                        .input(audioOnly)
                        .outputOptions('-c:v copy')
                        .outputOptions('-c:a aac')
                        .format('mp4')
                        .on('error', (err) => {
                            console.error('FFmpeg merge error:', err);
                            if (!res.headersSent) {
                                res.status(500).json({ success: false, error: 'Video processing failed' });
                            }
                        })
                        .pipe(res, { end: true });
                    return;
                }
            }

            videoStream.pipe(res);
            
            videoStream.on('error', (err) => {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: 'Download failed' });
                }
            });
        }

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
    const isValid = ytdl.validateURL(url);
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
