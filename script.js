const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ytdlp = require('yt-dlp-exec');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

/**
 * Detect platform for logic/logging
 */
function detectPlatform(url) {
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('instagram.com')) return 'Instagram';
    return 'Unknown';
}

/**
 * Routes
 */
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/health', (req, res) => res.json({ success: true, status: 'online' }));

/**
 * 🔥 UPDATED STABLE DOWNLOAD ROUTE
 * Fixed to handle MP3 extraction correctly
 */
app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const formatType = req.query.format || 'mp4';

    if (!videoUrl) return res.status(400).json({ success: false, error: 'No URL provided' });

    const platform = detectPlatform(videoUrl);

    try {
        console.log(`🚀 Cymor Engine: Starting ${platform} ${formatType} extraction...`);
        
        // Use the correct extension based on formatType
        const extension = formatType === 'mp3' ? 'mp3' : 'mp4';
        const fileName = `Cymor_${Date.now()}.${extension}`;
        const filePath = path.join(os.tmpdir(), fileName);

        // Build options dynamically
        const options = {
            output: filePath,
            noPlaylist: true,
            noWarnings: true,
            noCheckCertificates: true,
            maxFilesize: '50M',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            referer: platform === 'TikTok' ? 'https://www.tiktok.com/' : undefined
        };

        // Apply MP3 logic vs MP4 logic
        if (formatType === 'mp3') {
            options.extractAudio = true;
            options.audioFormat = 'mp3';
            options.format = 'bestaudio/best';
        } else {
            options.format = 'bestvideo+bestaudio/best';
            options.mergeOutputFormat = 'mp4';
        }

        await ytdlp(videoUrl, options);

        if (!fs.existsSync(filePath)) throw new Error('Engine failed to produce file.');

        return res.json({
            success: true,
            platform,
            title: fileName,
            download_url: `/stream-file?file=${fileName}`
        });

    } catch (error) {
        console.error('❌ EXTRACTION ERROR:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Server error or link blocked',
            details: error.message
        });
    }
});

/**
 * 🔥 STREAM & CLEANUP ROUTE
 */
app.get('/stream-file', (req, res) => {
    const file = req.query.file;
    if (!file) return res.status(400).send('No file specified');

    const filePath = path.join(os.tmpdir(), file);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Download expired or not found.');
    }

    res.download(filePath, file, (err) => {
        if (!err) {
            // Cleanup immediately after download finishes to save space
            fs.unlink(filePath, (uErr) => {
                if (!uErr) console.log(`🗑️ Storage cleared: ${file}`);
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 CymorAllVideoDownloader active on port ${PORT}`);
});
