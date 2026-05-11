const express = require('express');
const cors = require('cors');
const { create: createYtDlp } = require('yt-dlp-exec');
const https = require('https');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend files
app.use(express.static(path.join(__dirname, '.')));

/**
 * PATH FIX: On Render, we want to try the system's yt-dlp first 
 * because it's managed by Python/pip in your render.yaml.
 */
const ytDlp = createYtDlp('yt-dlp');

const detectPlatform = (url) => {
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    return 'Unknown';
};

// Main landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// The Download Engine
app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const formatType = req.query.format || 'mp4';

    if (!videoUrl) return res.status(400).json({ error: 'URL is required' });

    const platform = detectPlatform(videoUrl);

    try {
        const options = {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language: en-US,en;q=0.5'
            ]
        };

        // High Quality Logic (Enabled now that we have FFmpeg via render.yaml)
        if (formatType === 'mp3') {
            options.format = 'bestaudio/best';
        } else {
            // This grabs best video + best audio and merges them into an mp4
            options.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
        }

        const output = await ytDlp(videoUrl, options);

        // Extract the cleanest direct link available
        let downloadUrl = output.url;
        if (!downloadUrl && output.formats) {
            // Find high-res direct link if top-level url is missing
            const bestFormat = output.formats.reverse().find(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url);
            downloadUrl = bestFormat ? bestFormat.url : output.formats[0].url;
        }

        res.json({
            app: "CymorAllVideoDownloader",
            platform: platform,
            title: output.title || "Cymor_Video",
            thumbnail: output.thumbnail || "",
            duration: output.duration_string || "00:00",
            download_link: downloadUrl
        });

    } catch (error) {
        console.error('Cymor Backend Error:', error);
        res.status(500).json({ 
            error: "Extraction failed. The link might be private or region-locked.",
            details: error.message 
        });
    }
});

/**
 * Proxy Stream: Bypasses TikTok/FB's security and forces a download
 */
app.get('/stream', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('No URL provided');

    // Use a custom filename based on timestamp for uniqueness
    const filename = `Cymor_${Date.now()}.mp4`;

    https.get(url, (stream) => {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'video/mp4');
        stream.pipe(res);
    }).on('error', (e) => {
        res.status(500).send("Stream error: " + e.message);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('-------------------------------------------');
    console.log('🚀 CYMOR ALL VIDEO DOWNLOADER IS LIVE');
    console.log(`📡 Port: ${PORT}`);
    console.log('-------------------------------------------');
});
