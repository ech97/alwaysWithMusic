const youtubeSearchWithoutApiKey = require("youtube-search-without-api-key");

function filterOverDuration(rawDuration) {
    const MAX_DURATION_MIN = 5;
    const MINUTE_IDX = 0;
    // @ can't filter hours
    const parseDuration = rawDuration.split(":").map(Number);
    if (parseDuration.length > 2 || parseDuration[MINUTE_IDX] > MAX_DURATION_MIN) {
        return true;
    }
    return false;
}

function parseTitleInBracket(input) {
	const regex = /\[([^[\]]+)\]/g;
	const matches = input.match(regex);
    
    let titleInBracket = 'total praise';
    if (matches) {
    	titleInBracket = matches[0].slice(1, -1);
        titleInBracket += " music";
    }
    
    console.log('original text:', input);
    console.log('parsing title:', titleInBracket);
 
	return titleInBracket;
}

async function getYoutubeUrl(titleInBracket) {
    const searchTitle = parseTitleInBracket(titleInBracket);
    const musicUrls = await youtubeSearchWithoutApiKey.search(searchTitle);

    if (musicUrls) {
        for (let musicIdx = 0; musicIdx < musicUrls.length; musicIdx++) {
            const musicUrl = musicUrls[musicIdx];
            if (filterOverDuration(musicUrl.duration_raw) == true) {
                continue;
            }
            console.log('musicUrl:', musicUrl);
            return musicUrl.url;
        }
    }
    return undefined;
}

module.exports = getYoutubeUrl;
