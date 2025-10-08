# 🎬 AI-Powered YouTube Downloader

The most advanced, professional-grade YouTube Video & Audio Downloader built with AI optimization. Download YouTube videos and audio in multiple formats and qualities with a beautiful, modern interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)

## ✨ Features

### 🚀 Core Functionality
- **Smart Media Detection**: Automatically detects video/audio formats
- **Multiple Quality Options**: 4K, 1080p, 720p, 480p, 360p, 240p, 144p
- **Multiple Formats**: MP4 (video) and MP3 (audio)
- **Real-time Progress**: Live download progress indicators
- **Batch Downloads**: Download multiple videos at once
- **Playlist Support**: Handle YouTube playlists

### 🎯 AI-Powered Features
- **Automatic Metadata Fetching**: Title, thumbnail, duration, channel, views
- **Smart Quality Selection**: Auto-detect best available quality
- **Error Detection & Retry**: Intelligent error handling
- **URL Validation**: Real-time YouTube URL validation

### ⚡ Performance
- **High-Speed Engine**: Parallel streaming for maximum download speed
- **Optimized Processing**: FFmpeg integration for format conversion
- **Memory Efficient**: Stream-based processing to handle large files

### 🎨 User Experience
- **Modern UI**: Clean, professional interface
- **Fully Responsive**: Works on desktop, tablet, and mobile
- **Dark Theme**: Easy on the eyes
- **Smooth Animations**: Professional transitions and effects

## 🛠️ Technology Stack

- **Backend**: Node.js, Express
- **Video Processing**: ytdl-core, FFmpeg
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Architecture**: REST API with stream-based downloads

## 📦 Installation

### Prerequisites
- Node.js 14.0.0 or higher
- npm or yarn

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/dharmraj8033/YT_Downloader.git
cd YT_Downloader
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

4. **Open in browser**
```
http://localhost:3000
```

### Development Mode

For auto-restart on file changes:
```bash
npm run dev
```

### Docker Deployment

**Using Docker:**
```bash
docker build -t yt-downloader .
docker run -p 3000:3000 -v $(pwd)/downloads:/app/downloads yt-downloader
```

**Using Docker Compose:**
```bash
docker-compose up -d
```

Access at `http://localhost:3000`

## 🎯 Usage

### Web Interface

1. **Single Video Download**:
   - Paste YouTube URL in the input box
   - Click "Analyze" to fetch video information
   - Select desired quality and format
   - Click "Download"

2. **Batch Download**:
   - Paste multiple YouTube URLs (one per line) in the batch section
   - Click "Download All"
   - Videos will be downloaded sequentially

### API Endpoints

#### Get Video Information
```bash
POST /api/info
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "title": "Video Title",
    "author": "Channel Name",
    "thumbnail": "https://...",
    "duration": 300,
    "viewCount": 1000000,
    "videoFormats": [...],
    "audioFormats": [...]
  }
}
```

#### Download Video
```bash
POST /api/download
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=...",
  "quality": "1080p",
  "format": "mp4"
}
```

**Response**: Binary stream (video/audio file)

#### Validate URL
```bash
POST /api/validate
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=..."
}
```

**Response**:
```json
{
  "success": true,
  "valid": true
}
```

## 📁 Project Structure

```
YT_Downloader/
├── server.js              # Express server & API routes
├── package.json           # Dependencies & scripts
├── .gitignore            # Git ignore rules
├── README.md             # Documentation
├── public/               # Frontend files
│   ├── index.html        # Main HTML
│   ├── styles.css        # Styling
│   └── app.js            # Client-side logic
└── downloads/            # Downloaded files (auto-created)
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for custom configuration:

```env
PORT=3000
```

### Customize Download Location

Edit `server.js` to change the download directory:

```javascript
const downloadsDir = path.join(__dirname, 'downloads');
```

## 🚀 Deployment

### Deploy to Heroku

1. Create a Heroku app:
```bash
heroku create your-app-name
```

2. Push to Heroku:
```bash
git push heroku main
```

### Deploy to Vercel/Netlify

The app can be deployed to any Node.js hosting platform. Ensure the platform supports:
- Node.js 14+
- FFmpeg binary execution
- Sufficient memory for video processing

## ⚙️ Advanced Features

### Quality Options

- **4K (2160p)**: Ultra HD quality
- **1440p**: 2K quality
- **1080p**: Full HD
- **720p**: HD quality
- **480p**: SD quality
- **360p**: Low quality
- **240p/144p**: Mobile quality

### Format Support

- **MP4**: Video with audio (H.264 + AAC)
- **MP3**: Audio only (128kbps)

### Error Handling

The application handles:
- Invalid URLs
- Private/restricted videos
- Age-restricted content
- Network failures
- Format unavailability
- Automatic retry logic

## 🔒 Security & Privacy

- No data is stored on the server
- Downloads are streamed directly to client
- No user tracking or analytics
- Open-source and transparent

## ⚠️ Legal Disclaimer

This tool is for educational purposes only. Users are responsible for:
- Respecting YouTube's Terms of Service
- Obtaining proper rights/permissions for downloaded content
- Complying with copyright laws in their jurisdiction

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

**Issue**: Downloads fail or timeout
- **Solution**: Check internet connection, try a different video, or restart the server

**Issue**: Audio conversion fails
- **Solution**: Ensure FFmpeg is properly installed (auto-handled by ffmpeg-static)

**Issue**: Server won't start
- **Solution**: Check if port 3000 is already in use, try a different port

**Issue**: Video quality not available
- **Solution**: Not all videos have all qualities. Select "Highest Available"

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions

## 🌟 Acknowledgments

- [ytdl-core](https://github.com/fent/node-ytdl-core) - YouTube download library
- [FFmpeg](https://ffmpeg.org/) - Video processing
- [Express.js](https://expressjs.com/) - Web framework

## 📊 Roadmap

- [ ] Playlist auto-detection
- [ ] Download queue management
- [ ] Resume failed downloads
- [ ] Subtitle download support
- [ ] Video preview before download
- [ ] User preferences/settings
- [ ] Download history
- [ ] Mobile app version

---

**Built with ❤️ using AI-powered development**

Push the limits. Download smarter. 🚀