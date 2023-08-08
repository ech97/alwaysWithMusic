const mpv = require('node-mpv');

var mpvPlayer;

function playMusic(playFilePath) {
    mpvPlayer = new mpv({
		//'verbose': true,
        'audio_only': true,
    });

    try {
        mpvPlayer.load(playFilePath);
        mpvPlayer.volume(40);
        mpvPlayer.on('stopped', () => {
            console.log('done with playback');
        });
        console.log('now play music!!!');
        // add eventlistener to pause music while playing
    } catch (err) {
        console.error(err);
    }
}

function controlMusic(mode, volume) {
    if (mode === 'stop') {
        try {
            mpvPlayer.stop();
        } catch (err) {
            console.error(err);
        }
    }
    else if (mode === 'volume') {
        try {
            mpvPlayer.volume(volume);
        } catch (err) {
            console.error(err);
        }
    }
}

module.exports = {
    playMusic,
    controlMusic,
};
