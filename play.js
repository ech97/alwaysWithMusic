const mpv = require('node-mpv');

function playMusic(playFilePath) {
    const mpvPlayer = new mpv({
		//'verbose': true,
        'audio_only': true,
    });

    try {
        mpvPlayer.load(playFilePath);
        mpvPlayer.volume(40);
        mpvPlayer.on('stopped', () => {
            console.log('done with playback');
        });
        // add eventlistener to pause music while playing
    } catch (err) {
        console.error(err);
    }

    return mpvPlayer;
}

module.exports = playMusic;
