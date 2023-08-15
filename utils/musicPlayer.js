const mpv = require('node-mpv');

var mpvPlayer;
var globalVolume = 40;
var isPlayMusic = false;

function stopMusic() {
    if (mpvPlayer) {
        console.log('stop music executed');
        mpvPlayer.stop();
    }
    isPlayMusic = false;
}

function loadMusic(path) {
    mpvPlayer.load(path);
    mpvPlayer.volume(globalVolume);
    isPlayMusic = true;
    console.log('now play music!!');

    mpvPlayer.on('stopped', () => {
        console.log('done with playback');
        isPlayMusic = false;
    });
}

function setVolume(volume) {
    console.log('setting volume:', volume);
    globalVolume = volume;
    if (mpvPlayer) {
        mpvPlayer.volume(globalVolume);
        console.log('setting music volume', globalVolume);
    }
}

function playMusic(playFilePath) {
    // delete pre-instance
    stopMusic();

    mpvPlayer = new mpv({
		//'verbose': true,
        'audio_only': true,
    });

    try {
        loadMusic(playFilePath);
    } catch (err) {
        isPlayMusic = false;
        console.error(err);
    }
}

function controlMusic(mode, volume) {
    if (mode === 'stop') {
        stopMusic();
    }
    else if (mode === 'volume') {
        setVolume(volume);
    }
}

function getIsPlayMusic() {
    console.log('isPlayMusic:', isPlayMusic);
    return isPlayMusic;
}
module.exports = {
    playMusic,
    controlMusic,
    getIsPlayMusic,
};
