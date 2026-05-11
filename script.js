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
 * Download yt-dlp automatically
 */
async function setupYtDlp() {

    if (fs.existsSync(ytDlpPath)) {
        console.log('✅ yt-dlp already exists');
        return;
    }

    console.log('⬇️ Downloading yt-dlp binary...');

    await YTDlpWrap.downloadFromGithub(ytDlpPath);

    fs.chmodSync(ytDlpPath, 0o755);

    console.log('✅ yt-dlp installed successfully');
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
 * Health route
 */
app.get('/health', (req, res) => {
    res.json({ success: true, status: 'online' });
});

/**
 * Test yt-dlp
 */
app.get('/test-ytdlp', async (req, res) => {

    try {

        const version = await ytDlp.execPromise(['--version']);

        res.json({
            success: true,
            version: version.trim()
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * =========================
 * ULTRA STABLE DOWNLOAD ROUTE
 * =========================
 */
app.get('/download', async (req, res) => {

    const videoUrl = req.query.url;
    const formatType = req.query.format || 'mp4';

    if (!videoUrl) {
        return res.status(400).json({
            success: false,
            error: 'No URL provided'
        });
    }

    const platform = detectPlatform(videoUrl);

    console.log('================================');
    console.log('🚀 ULTRA STABLE MODE ACTIVE');
    console.log('📥 URL:', videoUrl);
    console.log('📱 PLATFORM:', platform);
    console.log('================================');

    /**
     * FORMAT LADDER (fix instability)
     */
    const formatLadder = [
        'bestvideo+bestaudio/best',
        'best[ext=mp4]/best',
        'best'
    ];

    if (formatType === 'mp3') {
        formatLadder.unshift('bestaudio/best');
    }

    /**
     * extraction function
     */
    const tryExtract = async (format) => {

        const args = [
            videoUrl,
            '--dump-single-json',
            '--no-warnings',
            '--no-check-certificates',
            '--prefer-free-formats',
            '--force-ipv4',
            '--geo-bypass',
            '--retries', '2',
            '--fragment-retries', '2',
            '--socket-timeout', '15',
            '--user-agent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
            '--format', format
        ];

        if (platform === 'TikTok') {
            args.push('--referer', 'https://www.tiktok.com/');
        }

        const result = await ytDlp.execPromise(args);
        return JSON.parse(result);
    };

    try {

        let output = null;

        // TRY MULTIPLE FORMATS (stability layer)
        for (const format of formatLadder) {

            try {
                output = await tryExtract(format);

                if (output && output.formats?.length) {
                    break;
                }

            } catch (e) {
                console.log('⚠️ format failed:', format);
            }
        }

        if (!output || !output.formats) {
            throw new Error('Extraction failed from all formats');
        }

        /**
         * =========================
         * SAFE DOWNLOAD SELECTION
         * =========================
         */
        let downloadUrl = null;

        const validFormats = output.formats
            .filter(f =>
                f.url &&
                f.vcodec !== 'none' &&
                !f.url.includes('manifest') &&
                !f.url.includes('html')
            )
            .sort((a, b) => (b.height || 0) - (a.height || 0));

        if (validFormats.length > 0) {
            downloadUrl = validFormats[0].url;
        }

        if (!downloadUrl) {
            downloadUrl = output.url;
        }

        /**
         * FINAL VALIDATION (prevents 0KB files)
         */
        if (!downloadUrl || downloadUrl.includes('<html')) {
            throw new Error('Blocked or invalid media URL detected');
        }

        return res.json({
            success: true,
            app: 'CymorAllVideoDownloader',
            mode: 'ULTRA_STABLE',
            platform,
            title: output.title || 'Cymor_Video',
            thumbnail: output.thumbnail || '',
            duration: output.duration || 0,
            uploader: output.uploader || 'Unknown',
            download_link: downloadUrl
        });

    } catch (error) {

        console.error('❌ ULTRA STABLE FAILED:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Extraction failed (Ultra Stable Mode)',
            details: error.message
        });
    }
});

/**
 * Stream route
 */
app.get('/stream', (req, res) => {

    const url = req.query.url;

    if (!url) {
        return res.status(400).send('No URL');
    }

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
