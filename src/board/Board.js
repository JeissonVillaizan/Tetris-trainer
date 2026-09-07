export default class Board {
	constructor(columns, rows) {
		this.columns = columns;
		this.rows = rows;
		this.reset();
	}

	reset() {
		this.cells = Array.from({ length: this.rows }, () =>
			Array(this.columns).fill(null),
		);
	}

	collides(piece, offsetX = 0, offsetY = 0, shape = piece.shape) {
		for (let rowIndex = 0; rowIndex < shape.length; rowIndex += 1) {
			for (
				let columnIndex = 0;
				columnIndex < shape[rowIndex].length;
				columnIndex += 1
			) {
				if (!shape[rowIndex][columnIndex]) continue;
				const boardX = piece.x + columnIndex + offsetX;
				const boardY = piece.y + rowIndex + offsetY;
				if (boardX < 0 || boardX >= this.columns || boardY >= this.rows)
					return true;
				if (boardY >= 0 && this.cells[boardY][boardX]) return true;
			}
		}
		return false;
	}

	place(piece) {
		piece.shape.forEach((row, rowIndex) => {
			row.forEach((cell, columnIndex) => {
				if (cell && piece.y + rowIndex >= 0) {
					this.cells[piece.y + rowIndex][piece.x + columnIndex] = piece.color;
				}
			});
		});
	}

	clearCompletedLines() {
		let cleared = 0;
		for (let rowIndex = this.rows - 1; rowIndex >= 0; rowIndex -= 1) {
			if (this.cells[rowIndex].every(Boolean)) {
				this.cells.splice(rowIndex, 1);
				this.cells.unshift(Array(this.columns).fill(null));
				cleared += 1;
				rowIndex += 1;
			}
		}
		return cleared;
	}
}
