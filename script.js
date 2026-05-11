const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');
const fs = require('fs');
const os = require('os'); // Added for temporary directory access

const YTDlpWrap = require('yt-dlp-wrap').default;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

/**
 * yt-dlp binary path
 */
const ytDlpPath = path.join(__dirname, 'yt-dlp');

/**
 * yt-dlp wrapper
 */
const ytDlp = new YTDlpWrap(ytDlpPath);

/**
 * Auto install yt-dlp
 */
async function setupYtDlp() {
    if (fs.existsSync(ytDlpPath)) {
        console.log('✅ yt-dlp already exists');
        return;
    }

    console.log('⬇️ Downloading yt-dlp...');
    await YTDlpWrap.downloadFromGithub(ytDlpPath);
    fs.chmodSync(ytDlpPath, 0o755);
    console.log('✅ yt-dlp installed');
}

/**
 * Detect platform
 */
function detectPlatform(url) {
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('instagram.com')) return 'Instagram';
    return 'Unknown';
}

/**
 * Homepage
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({ success: true, status: 'online' });
});

/**
 * yt-dlp test
 */
app.get('/test-ytdlp', async (req, res) => {
    try {
        const version = await ytDlp.execPromise(['--version']);
        res.json({ success: true, version: version.trim() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * =========================
 * 🔥 FIXED DOWNLOAD ROUTE
 * =========================
 */
app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const formatType = req.query.format || 'mp4';

    if (!videoUrl) {
        return res.status(400).json({ success: false, error: 'No URL provided' });
    }

    const platform = detectPlatform(videoUrl);

    try {
        console.log('🚀 SERVER DOWNLOAD MODE ACTIVE');
        
        // FIX: Use /tmp directory for Render/Docker compatibility
        const fileName = `Cymor_${Date.now()}.mp4`;
        const filePath = path.join(os.tmpdir(), fileName);

        // TikTok and YouTube require specific formats to avoid 0kb files
        // bestvideo+bestaudio/best ensures we get both streams merged
        let format = formatType === 'mp3' ? 'bestaudio/best' : 'bestvideo+bestaudio/best';

        const args = [
            videoUrl,
            '--output', filePath,
            '--format', format,
            '--merge-output-format', 'mp4',
            '--no-warnings',
            '--no-check-certificate',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        ];

        if (platform === 'TikTok') {
            args.push('--referer', 'https://www.tiktok.com/');
        }

        await ytDlp.execPromise(args);

        /**
         * 🔥 VALIDATE FILE
         */
        if (!fs.existsSync(filePath)) {
            throw new Error('Download failed: File not created');
        }

        const stats = fs.statSync(filePath);
        if (stats.size < 2000) { // If less than 2KB, it's likely an error message/block
            fs.unlinkSync(filePath);
            throw new Error('File too small. The platform might be blocking the request.');
        }

        return res.json({
            success: true,
            mode: 'SERVER_DOWNLOAD',
            platform,
            title: fileName,
            download_url: `/stream-file?file=${fileName}`
        });

    } catch (error) {
        console.error('❌ DOWNLOAD FAILED:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Download failed',
            details: error.message
        });
    }
});

/**
 * =========================
 * 🔥 STREAM FILE ROUTE
 * =========================
 */
app.get('/stream-file', (req, res) => {
    const file = req.query.file;
    if (!file) return res.status(400).send('No file');

    // FIX: Match the /tmp directory path used in /download
    const filePath = path.join(os.tmpdir(), file);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found or expired');
    }

    res.download(filePath, file, (err) => {
        if (err) {
            console.error("Stream error:", err);
        }
        // Cleanup file after download is sent to user
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error("Cleanup error:", unlinkErr);
        });
    });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;

setupYtDlp()
    .then(() => {
        app.listen(PORT, () => {
            console.log('🚀 Server running on port', PORT);
        });
    })
    .catch(error => {
        console.error('❌ yt-dlp setup failed');
        console.error(error);
    });
