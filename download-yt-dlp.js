const https = require('https');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const url = isWin ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const filename = isWin ? 'yt-dlp.exe' : 'yt-dlp';

console.log(`Downloading ${filename} from ${url}`);

https.get(url, (res) => {
    const filePath = path.join(__dirname, filename);
    const file = fs.createWriteStream(filePath);
    res.pipe(file);
    file.on('finish', () => {
        if (!isWin) {
            fs.chmodSync(filePath, '755');
        }
        file.close();
        console.log(`${filename} downloaded successfully`);
    });
}).on('error', (err) => {
    console.error('Download failed:', err);
});