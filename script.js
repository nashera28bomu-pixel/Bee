const express = require('express');
const cors = require('cors');
const { create: createYtDlp } = require('yt-dlp-exec');
const https = require('https');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

/**
 * Render yt-dlp binary path
 */
const ytDlp = createYtDlp('/opt/render/project/.local/bin/yt-dlp');

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
 * Health check route
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        app: 'CymorAllVideoDownloader'
    });
});

/**
 * Download API
 */
app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const formatType = req.query.format || 'mp4';

    if (!videoUrl) {
        return res.status(400).json({
            error: 'No URL provided'
        });
    }

    const platform = detectPlatform(videoUrl);

    try {
        console.log('--------------------------------');
        console.log('📥 Processing URL:', videoUrl);
        console.log('🎬 Format:', formatType);
        console.log('--------------------------------');

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
         * Video / Audio format logic
         */
        if (formatType === 'mp3') {
            options.format = 'bestaudio/best';
        } else {
            options.format =
                'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
        }

        /**
         * Extract video information
         */
        const output = await ytDlp(videoUrl, options);

        if (!output) {
            throw new Error('No data returned from yt-dlp');
        }

        /**
         * Get best downloadable URL
         */
        let downloadUrl = output.url;

        if (!downloadUrl && output.formats?.length) {
            const formats = output.formats.filter(
                f => f.url && f.vcodec !== 'none'
            );

            const bestFormat = formats.sort((a, b) => {
                return (b.height || 0) - (a.height || 0);
            })[0];

            if (bestFormat) {
                downloadUrl = bestFormat.url;
            }
        }

        if (!downloadUrl) {
            throw new Error('Failed to extract downloadable media');
        }

        /**
         * Success response
         */
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

        console.error('❌ CYMOR BACKEND ERROR');
        console.error(error);

        res.status(500).json({
            success: false,
            error: 'Extraction failed',
            details: error.message || 'Unknown server error'
        });
    }
});

/**
 * Stream Proxy
 * Forces browser download
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

            res.setHeader('Content-Type', 'video/mp4');

            stream.pipe(res);

        }).on('error', err => {

            console.error('❌ Stream Error:', err);

            res.status(500).send(
                'Stream failed: ' + err.message
            );
        });

    } catch (error) {

        console.error('❌ Proxy Error:', error);

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
