const mpv = require('node-mpv');

function playMusic() {
    const mpvPlayer = new mpv({
		'verbose': true,
        'audio_only': true,
    });
    mpvPlayer.load(process.env.DEFAULT_PLAY_FILE_PATH);
    mpvPlayer.volume(50);
}

module.exports = playMusic;
