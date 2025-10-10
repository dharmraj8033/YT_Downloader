const https = require('https');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const DOWNLOAD_URL = isWin
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const FILENAME = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const FILE_PATH = path.join(__dirname, FILENAME);

function download(url, redirectCount = 0) {
    if (redirectCount > 5) {
        console.error('Too many redirects while downloading yt-dlp');
        process.exitCode = 1;
        return;
    }

    console.log(`Downloading ${FILENAME} from ${url}`);

    https
        .get(url, (res) => {
            const { statusCode, headers } = res;

            // Handle redirects
            if (statusCode >= 300 && statusCode < 400 && headers.location) {
                const next = headers.location.startsWith('http')
                    ? headers.location
                    : new URL(headers.location, url).toString();
                res.resume(); // discard data
                return download(next, redirectCount + 1);
            }

            if (statusCode !== 200) {
                console.error(`Failed to download yt-dlp: HTTP ${statusCode}`);
                res.resume();
                process.exitCode = 1;
                return;
            }

            const file = fs.createWriteStream(FILE_PATH);
            res.pipe(file);

            file.on('finish', () => {
                file.close(() => {
                    try {
                        const stats = fs.statSync(FILE_PATH);
                        if (stats.size < 1024 * 1024) {
                            // Sanity check: expect >1MB
                            throw new Error(`Downloaded file size too small: ${stats.size} bytes`);
                        }
                        if (!isWin) {
                            fs.chmodSync(FILE_PATH, '755');
                        }
                        console.log(`${FILENAME} downloaded successfully (${stats.size} bytes)`);
                    } catch (e) {
                        console.error('Download verification failed:', e.message);
                        try { fs.unlinkSync(FILE_PATH); } catch {}
                        process.exitCode = 1;
                    }
                });
            });

            file.on('error', (err) => {
                console.error('Write error while downloading yt-dlp:', err.message);
                try { fs.unlinkSync(FILE_PATH); } catch {}
                process.exitCode = 1;
            });
        })
        .on('error', (err) => {
            console.error('Download failed:', err.message);
            process.exitCode = 1;
        });
}

download(DOWNLOAD_URL);