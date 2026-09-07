export default class Matrix {
	static clone(matrix) {
		return matrix.map((row) => row.slice());
	}

	static rotate(matrix) {
		return matrix[0].map((_, columnIndex) =>
			matrix.map((row) => row[columnIndex]).reverse(),
		);
	}
}
