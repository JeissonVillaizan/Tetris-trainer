import CONFIG from '../config/gameConfig.js';

export default class Renderer {
	constructor(boardCanvas, nextCanvas, board, state) {
		this.boardCanvas = boardCanvas;
		this.boardContext = boardCanvas.getContext('2d');
		this.nextCanvas = nextCanvas;
		this.nextContext = nextCanvas.getContext('2d');
		this.board = board;
		this.state = state;
		boardCanvas.width = CONFIG.columns * CONFIG.blockSize;
		boardCanvas.height = CONFIG.rows * CONFIG.blockSize;
	}

	drawCell(context, x, y, color, cellSize = CONFIG.blockSize) {
		const pixelX = x * cellSize;
		const pixelY = y * cellSize;
		context.fillStyle = color;
		context.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2);
		context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
		context.strokeRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2);
	}

	drawPiece(context, piece, color, forcedY = piece.y) {
		piece.shape.forEach((row, rowIndex) => {
			row.forEach((cell, columnIndex) => {
				const boardY = forcedY + rowIndex;
				if (cell && boardY >= 0)
					this.drawCell(context, piece.x + columnIndex, boardY, color);
			});
		});
	}

	drawOverlay(message) {
		const context = this.boardContext;
		context.save();
		context.fillStyle = 'rgba(3, 7, 16, 0.62)';
		context.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);
		context.fillStyle = '#e9f4ff';
		context.font = 'bold 30px Trebuchet MS, sans-serif';
		context.textAlign = 'center';
		context.fillText(
			message,
			this.boardCanvas.width / 2,
			this.boardCanvas.height / 2,
		);
		context.restore();
	}

	drawBoard(currentPiece) {
		const context = this.boardContext;
		context.clearRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);
		context.fillStyle = '#07111f';
		context.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);
		for (let y = 0; y < this.board.rows; y += 1) {
			for (let x = 0; x < this.board.columns; x += 1) {
				if (this.board.cells[y][x])
					this.drawCell(context, x, y, this.board.cells[y][x]);
				else {
					context.strokeStyle = 'rgba(255, 255, 255, 0.03)';
					context.strokeRect(
						x * CONFIG.blockSize + 0.5,
						y * CONFIG.blockSize + 0.5,
						CONFIG.blockSize,
						CONFIG.blockSize,
					);
				}
			}
		}
		if (currentPiece) {
			let ghostY = currentPiece.y;
			while (!this.board.collides(currentPiece, 0, ghostY - currentPiece.y + 1))
				ghostY += 1;
			this.drawPiece(context, currentPiece, 'rgba(255,255,255,0.18)', ghostY);
			this.drawPiece(context, currentPiece, currentPiece.color);
		}
		if (this.state.paused && !this.state.gameOver) this.drawOverlay('Pausa');
		else if (this.state.gameOver) this.drawOverlay('Game Over');
	}

	drawNextPiece(piece) {
		const context = this.nextContext;
		context.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
		context.fillStyle = '#07111f';
		context.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
		if (!piece) return;
		const offsetX = Math.floor((4 - piece.shape[0].length) / 2);
		const offsetY = Math.floor((4 - piece.shape.length) / 2);
		piece.shape.forEach((row, rowIndex) =>
			row.forEach((cell, columnIndex) => {
				if (cell)
					this.drawCell(
						context,
						offsetX + columnIndex,
						offsetY + rowIndex,
						piece.color,
					);
			}),
		);
	}
}
