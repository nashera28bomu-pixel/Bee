const express = require('express');
const cors = require('cors');
const { create: createYtDlp } = require('yt-dlp-exec');
const https = require('https');
const path = require('path');

const app = express();

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

/**
 * IMPORTANT:
 * Use global yt-dlp binary installed by pip
 */
const ytDlp = createYtDlp('yt-dlp');

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
    res.json({
        success: true,
        status: 'online',
        app: 'CymorAllVideoDownloader'
    });
});

/**
 * yt-dlp test route
 */
app.get('/test-ytdlp', async (req, res) => {

    try {

        const version = await ytDlp('--version');

        res.json({
            success: true,
            yt_dlp_version: version.toString().trim()
        });

    } catch (error) {

        console.error('❌ yt-dlp test failed');
        console.error(error);

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

    const platform = detectPlatform(videoUrl);

    try {

        console.log('================================');
        console.log('📥 NEW DOWNLOAD REQUEST');
        console.log('🔗 URL:', videoUrl);
        console.log('🎬 FORMAT:', formatType);
        console.log('================================');

        const options = {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            geoBypass: true,
            addHeader: [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language: en-US,en;q=0.9'
            ]
        };

        /**
         * Format selection
         */
        if (formatType === 'mp3') {

            options.format = 'bestaudio/best';

        } else {

            options.format =
                'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
        }

        /**
         * Run yt-dlp
         */
        const output = await ytDlp(videoUrl, options);

        if (!output) {
            throw new Error('yt-dlp returned empty response');
        }

        /**
         * Get direct downloadable URL
         */
        let downloadUrl = output.url;

        /**
         * Fallback search
         */
        if (!downloadUrl && output.formats?.length) {

            const validFormats = output.formats.filter(format =>
                format.url &&
                format.vcodec !== 'none'
            );

            validFormats.sort((a, b) => {
                return (b.height || 0) - (a.height || 0);
            });

            if (validFormats.length > 0) {
                downloadUrl = validFormats[0].url;
            }
        }

        if (!downloadUrl) {
            throw new Error('No downloadable media URL found');
        }

        /**
         * Success response
         */
        return res.json({
            success: true,
            app: 'CymorAllVideoDownloader',
            platform: platform,
            title: output.title || 'Cymor_Video',
            thumbnail: output.thumbnail || '',
            duration: output.duration || 0,
            uploader: output.uploader || 'Unknown',
            webpage_url: output.webpage_url || '',
            download_link: downloadUrl
        });

    } catch (error) {

        console.error('❌ DOWNLOAD ERROR');
        console.error(error);

        return res.status(500).json({
            success: false,
            error: 'Extraction failed',
            details: error.message || 'Unknown error'
        });
    }
});

/**
 * Stream route
 */
app.get('/stream', async (req, res) => {

    const url = req.query.url;

    if (!url) {
        return res.status(400).send('No URL provided');
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

            console.error('❌ STREAM ERROR');
            console.error(error);

            res.status(500).send(
                'Stream failed: ' + error.message
            );
        });

    } catch (error) {

        console.error('❌ PROXY ERROR');
        console.error(error);

        res.status(500).send(
            'Proxy failed'
        );
    }
});

/**
 * 404 handler
 */
app.use((req, res) => {

    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log('====================================');
    console.log('🚀 CYMOR ALL VIDEO DOWNLOADER LIVE');
    console.log(`🌍 PORT: ${PORT}`);
    console.log('====================================');
});
