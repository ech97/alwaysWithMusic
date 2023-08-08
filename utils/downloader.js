const youtubedl = require('youtube-dl-exec');
const dotenv = require('dotenv').config();

async function downloadMusic(downloadUrl) {
    try {
        // download over 10s throw error
        const output = await youtubedl(downloadUrl, {
            format: 'ba',
            'force-overwrites': true,
            'sponsorblock-remove': 'intro',
            'quiet': false,
            'output': process.env.PLAY_FILE_PATH,
        });
        console.log('successfully downloaded.', output);
        return process.env.PLAY_FILE_PATH;
    } catch (err) {
        console.log('not available youtube link');
        return process.env.DEFAULT_PLAY_FILE_PATH;
    }
    return process.env.DEFAULT_PLAY_FILE_PATH;
}

module.exports = downloadMusic;
