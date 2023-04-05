const IDGen = (length) => {
	let id = '';
	for (let x = 0; x < length; x++) {
		id = id.concat(String(Math.ceil(Math.random() * 9)));
	}
	return id;
};
module.exports = IDGen;