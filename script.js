const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');
const fs = require('fs');

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
 * 🔥 FIXED DOWNLOAD ROUTE (REAL FILE DOWNLOAD)
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
        console.log('📥 URL:', videoUrl);
        console.log('📱 PLATFORM:', platform);

        const fileName = `video_${Date.now()}.mp4`;
        const filePath = path.join(__dirname, fileName);

        let format = 'best';

        if (formatType === 'mp3') {
            format = 'bestaudio/best';
        }

        const args = [
            videoUrl,
            '--output', filePath,
            '--no-warnings',
            '--force-ipv4',
            '--geo-bypass',
            '--retries', '3',
            '--format', format
        ];

        if (platform === 'TikTok') {
            args.push('--referer', 'https://www.tiktok.com/');
        }

        await ytDlp.execPromise(args);

        /**
         * 🔥 VALIDATE FILE (CRITICAL FIX)
         */
        const stats = fs.existsSync(filePath)
            ? fs.statSync(filePath)
            : null;

        if (!stats || stats.size < 10000) {
            throw new Error('Invalid or blocked download (file too small)');
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
 * 🔥 STREAM FILE ROUTE (FIXED)
 * =========================
 */
app.get('/stream-file', (req, res) => {

    const file = req.query.file;

    if (!file) return res.status(400).send('No file');

    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }

    res.download(filePath, (err) => {

        // cleanup after download
        fs.unlink(filePath, () => {});
    });
});

/**
 * Stream external fallback (optional)
 */
app.get('/stream', (req, res) => {

    const url = req.query.url;

    if (!url) return res.status(400).send('No URL');

    const filename = `Cymor_${Date.now()}.mp4`;

    https.get(url, stream => {

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        );

        res.setHeader('Content-Type', 'video/mp4');

        stream.pipe(res);

    }).on('error', error => {
        res.status(500).send('Stream failed: ' + error.message);
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
