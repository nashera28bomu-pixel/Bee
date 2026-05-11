const express = require('express');
const cors = require('cors');
const { create: createYtDlp } = require('yt-dlp-exec');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// Path to yt-dlp binary
const ytDlp = createYtDlp('./bin/yt-dlp');

/**
 * Detects the platform based on the URL
 */
const detectPlatform = (url) => {
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    return 'Unknown';
};

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const formatType = req.query.format || 'mp4'; // Default to mp4, can be 'mp3'

    if (!videoUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const platform = detectPlatform(videoUrl);

    try {
        const options = {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            addHeader: [
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            ]
        };

        // Select format based on user choice
        if (formatType === 'mp3') {
            options.format = 'bestaudio/best';
        } else {
            // bestvideo+bestaudio ensures high quality MP4
            options.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
        }

        const output = await ytDlp(videoUrl, options);

        // Extract the best direct link
        let downloadUrl = output.url;
        if (!downloadUrl && output.formats) {
            // Filter for high quality formats if direct URL isn't in top level
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

/**
 * Proxy stream to bypass direct link expiration or 403 errors
 */
app.get('/stream', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('No URL provided');

    https.get(url, (stream) => {
        // Set generic video header; browser will handle specific codec
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
