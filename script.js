const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const YTDlpWrap = require('yt-dlp-wrap').default;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

/**
 * yt-dlp configuration
 */
const ytDlpPath = path.join(__dirname, 'yt-dlp');
const ytDlp = new YTDlpWrap(ytDlpPath);

/**
 * Robust Auto install/check for yt-dlp
 * Ensures the binary is healthy and executable
 */
async function setupYtDlp() {
    try {
        if (fs.existsSync(ytDlpPath)) {
            const stats = fs.statSync(ytDlpPath);
            // If file is valid (not 0kb), we are good to go
            if (stats.size > 1000) {
                console.log('✅ yt-dlp exists and looks healthy');
                return;
            }
            console.log('⚠️ Corrupted yt-dlp found, removing...');
            fs.unlinkSync(ytDlpPath); 
        }

        console.log('⬇️ Downloading yt-dlp from GitHub...');
        await YTDlpWrap.downloadFromGithub(ytDlpPath);
        fs.chmodSync(ytDlpPath, 0o755);
        console.log('✅ yt-dlp installed successfully');
    } catch (error) {
        console.error('❌ CRITICAL: yt-dlp setup failed:', error.message);
        // Exit so Render can attempt a fresh container restart
        process.exit(1); 
    }
}

/**
 * Detect platform for logging and referer logic
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

app.get('/test-ytdlp', async (req, res) => {
    try {
        const version = await ytDlp.execPromise(['--version']);
        res.json({ success: true, version: version.trim() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🔥 UPDATED DOWNLOAD ROUTE
 * Optimized for Render Free Tier stability
 */
app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const formatType = req.query.format || 'mp4';

    if (!videoUrl) return res.status(400).json({ success: false, error: 'No URL provided' });

    const platform = detectPlatform(videoUrl);

    try {
        console.log(`🚀 Extraction started for: ${platform}`);
        
        const fileName = `Cymor_${Date.now()}.mp4`;
        const filePath = path.join(os.tmpdir(), fileName);

        // Best quality video + audio, or just audio for MP3
        let format = formatType === 'mp3' ? 'bestaudio/best' : 'bestvideo+bestaudio/best';

        const args = [
            videoUrl,
            '--output', filePath,
            '--format', format,
            '--merge-output-format', 'mp4',
            '--no-playlist',
            '--no-warnings',
            '--no-check-certificate',
            '--max-filesize', '50M', // Protects Render RAM/Disk from crashing
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];

        if (platform === 'TikTok') {
            args.push('--referer', 'https://www.tiktok.com/');
        }

        await ytDlp.execPromise(args);

        // Final validation
        if (!fs.existsSync(filePath)) throw new Error('File was not created by the engine.');

        const stats = fs.statSync(filePath);
        if (stats.size < 5000) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            throw new Error('Link blocked or file corrupted (size too small).');
        }

        return res.json({
            success: true,
            platform,
            title: fileName,
            download_url: `/stream-file?file=${fileName}`
        });

    } catch (error) {
        console.error('❌ DOWNLOAD ERROR:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Extraction failed',
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
        return res.status(404).send('Download expired. Please try again.');
    }

    res.download(filePath, file, (err) => {
        if (err) console.error("Stream error:", err);
        
        // Immediate cleanup to free up Render's limited disk space
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error("Cleanup error:", unlinkErr);
            else console.log(`🗑️ Temp file ${file} cleared.`);
        });
    });
});

/**
 * Start Server
 */
const PORT = process.env.PORT || 3000;

setupYtDlp().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Cymor Engine running on port ${PORT}`);
    });
});
