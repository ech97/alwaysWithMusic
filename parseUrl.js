function parseUrlInBracket(input) {
	const regex = /\[(https?:\/\/[^\]]+)\]/g;
	const matches = input.match(regex);

	let urlInBracket;
	if (matches) {
		urlInBracket = matches[0].slice(1, -1);
		return urlInBracket;
	}
	urlInBracket = "https://youtu.be/gyTpRWXXyfg";
	return urlInBracket;
}

module.exports = parseUrlInBracket;
