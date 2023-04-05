const verifyIDFormat = (ID) => {
	if (ID.length !== 15) {
		return false;
	}
	
	return !isNaN(ID);
};

module.exports = verifyIDFormat;