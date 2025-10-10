const { spawn } = require('child_process');
const path = require('path');
const isWin = process.platform === 'win32';
const ytDlpPath = path.join(__dirname, isWin ? 'yt-dlp.exe' : 'yt-dlp');

function runYtDlp(url, res) {
    const ytDlpCmd = ytDlpPath; // direct binary call
    const ytDlpArgs = ['-o', '-', url]; // sample args

    const ytProcess = spawn(ytDlpCmd, ytDlpArgs);

    ytProcess.stdout.pipe(res);
    ytProcess.stderr.on('data', d => console.error(d.toString()));
    ytProcess.on('error', err => console.error('Spawn error:', err));
}
