const CONFIG_UNFREEZED = {
	columns: 10,
	rows: 20,
	blockSize: 30,
	baseDropInterval: 800,
	minDropInterval: 120,
	lineScores: [0, 100, 300, 500, 800],
};

const CONFIG = Object.freeze(CONFIG_UNFREEZED);

export default CONFIG;
