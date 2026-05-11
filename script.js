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

    if (
        url.includes('facebook.com') ||
        url.includes('fb.watch')
    ) return 'Facebook';

    if (
        url.includes('youtube.com') ||
        url.includes('youtu.be')
    ) return 'YouTube';

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
    res.json({
        success: true,
        status: 'online'
    });
});

/**
 * Test yt-dlp
 */
app.get('/test-ytdlp', async (req, res) => {

    try {

        const version = await ytDlp.execPromise([
            '--version'
        ]);

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
 * Download route
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

    try {

        const platform = detectPlatform(videoUrl);

        console.log('📥 Download request:', videoUrl);

        /**
         * TikTok FIX (important)
         */
        let format = 'bestvideo+bestaudio/best';

        const options = [
            videoUrl,
            '--dump-single-json',
            '--no-warnings',
            '--no-check-certificates',
            '--prefer-free-formats',
            '--geo-bypass'
        ];

        if (platform === 'TikTok') {
            format = 'best';
            options.push('--referer', 'https://www.tiktok.com/');
        }

        if (formatType === 'mp3') {
            format = 'bestaudio/best';
        }

        options.push('--format', format);

        const result = await ytDlp.execPromise(options);

        const output = JSON.parse(result);

        /**
         * =========================
         * FIXED DOWNLOAD LOGIC
         * =========================
         */

        let downloadUrl = null;

        // PRIORITY: pick best real video format
        if (output.formats && output.formats.length > 0) {

            const validFormats = output.formats
                .filter(f =>
                    f.url &&
                    f.vcodec !== 'none' &&
                    !f.url.includes('manifest')
                )
                .sort((a, b) => (b.height || 0) - (a.height || 0));

            if (validFormats.length > 0) {
                downloadUrl = validFormats[0].url;
            }
        }

        // fallback only if needed
        if (!downloadUrl) {
            downloadUrl = output.url;
        }

        if (!downloadUrl) {
            throw new Error('No downloadable URL found');
        }

        res.json({
            success: true,
            app: 'CymorAllVideoDownloader',
            platform,
            title: output.title || 'Cymor_Video',
            thumbnail: output.thumbnail || '',
            duration: output.duration || 0,
            uploader: output.uploader || 'Unknown',
            download_link: downloadUrl
        });

    } catch (error) {

        console.error('❌ DOWNLOAD ERROR');
        console.error(error);

        res.status(500).json({
            success: false,
            error: 'Extraction failed',
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

    try {

        const filename = `Cymor_${Date.now()}.mp4`;

        https.get(url, stream => {

            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${filename}"`
            );

            res.setHeader(
                'Content-Type',
                'video/mp4'
            );

            stream.pipe(res);

        }).on('error', error => {

            res.status(500).send(
                'Stream failed: ' + error.message
            );
        });

    } catch (error) {

        res.status(500).send(
            'Proxy failed'
        );
    }
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
