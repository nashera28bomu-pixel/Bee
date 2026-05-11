const express = require('express');
const cors = require('cors');
const { create: createYtDlp } = require('yt-dlp-exec');
const https = require('https');
const path = require('path'); // Added this

const app = express();
app.use(cors());
app.use(express.json());

// 1. TELL EXPRESS WHERE YOUR HTML/CSS FILES ARE
app.use(express.static(path.join(__dirname, '.')));

const ytDlp = createYtDlp('./bin/yt-dlp');

const detectPlatform = (url) => {
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    return 'Unknown';
};

// 2. ADD THIS ROUTE TO SERVE THE FRONTEND
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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
            addHeader: ['user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36']
        };

        if (formatType === 'mp3') {
            options.format = 'bestaudio/best';
        } else {
            options.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
        }

        const output = await ytDlp(videoUrl, options);

        let downloadUrl = output.url;
        if (!downloadUrl && output.formats) {
            downloadUrl = output.formats.reverse().find(f => f.url)?.url;
        }

        res.json({
            app: "CymorAllVideoDownloader",
            platform: platform,
            title: output.title,
            author: output.uploader || output.author,
            download_link: downloadUrl,
            thumbnail: output.thumbnail,
            duration: output.duration_string,
            format: formatType
        });

    } catch (error) {
        console.error('Extraction Error:', error);
        res.status(500).json({ error: 'Failed to process the link' });
    }
});

app.get('/stream', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('No URL provided');

    https.get(url, (stream) => {
        // Set attachment header so it downloads instead of just playing in browser
        res.setHeader('Content-Disposition', 'attachment; filename="CymorDownload.mp4"');
        res.setHeader('Content-Type', 'video/mp4');
        stream.pipe(res);
    }).on('error', (e) => {
        res.status(500).send('Streaming error: ' + e.message);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`CymorAllVideoDownloader running on port ${PORT}`);
});
