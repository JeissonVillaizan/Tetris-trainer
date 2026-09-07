import Matrix from './Matrix.js';

export default class PieceFactory {
	constructor(definitions, bag, columns) {
		this.definitions = definitions;
		this.bag = bag;
		this.columns = columns;
	}

	create(type = this.bag.next()) {
		const definition = this.definitions[type];
		return {
			type,
			color: definition.color,
			shape: Matrix.clone(definition.shape),
			x: Math.floor((this.columns - definition.shape[0].length) / 2),
			y: 0,
		};
	}
}
