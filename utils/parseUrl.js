function parseUrlInBracket(input) {
	//const regex = /\[(https?:\/\/[^\]]+)\]/g;
    const regex = /https?:\/\/[^\]]+/g;
	const matches = input.match(regex);
    
    let urlInBracket;
    if (matches) {
    	urlInBracket = matches[0];
    }
	//urlInBracket = "https://youtu.be/gyTpRWXXyfg";
    
    console.log('original text:', input);
    console.log('parsing url:', urlInBracket);
 
	return urlInBracket;
}

module.exports = parseUrlInBracket;
