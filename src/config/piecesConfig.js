import deepFreeze from '../utils/deepFreeze.js';

const PIECE_DEFINITIONS_UNFREEZED = {
	I: {
		color: '#55e1ff',
		shape: [
			[0, 0, 0, 0],
			[1, 1, 1, 1],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
	},
	O: {
		color: '#ffe76a',
		shape: [
			[1, 1],
			[1, 1],
		],
	},
	T: {
		color: '#c68bff',
		shape: [
			[0, 1, 0],
			[1, 1, 1],
			[0, 0, 0],
		],
	},
	S: {
		color: '#75f0a3',
		shape: [
			[0, 1, 1],
			[1, 1, 0],
			[0, 0, 0],
		],
	},
	Z: {
		color: '#ff7d8a',
		shape: [
			[1, 1, 0],
			[0, 1, 1],
			[0, 0, 0],
		],
	},
	J: {
		color: '#76a9ff',
		shape: [
			[1, 0, 0],
			[1, 1, 1],
			[0, 0, 0],
		],
	},
	L: {
		color: '#ffb26d',
		shape: [
			[0, 0, 1],
			[1, 1, 1],
			[0, 0, 0],
		],
	},
};

const PIECE_DEFINITIONS = deepFreeze(PIECE_DEFINITIONS_UNFREEZED);

export default PIECE_DEFINITIONS;
