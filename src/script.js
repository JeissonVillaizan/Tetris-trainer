const CONFIG = {
	columns: 10,
	rows: 20,
	blockSize: 30,
	baseDropInterval: 800,
	minDropInterval: 120,
	lineScores: [0, 100, 300, 500, 800],
};

const PIECE_DEFINITIONS = {
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

class Matrix {
	static clone(matrix) {
		return matrix.map((row) => row.slice());
	}

	static rotate(matrix) {
		return matrix[0].map((_, columnIndex) =>
			matrix.map((row) => row[columnIndex]).reverse(),
		);
	}
}

class PieceBag {
	constructor(types) {
		this.types = types;
		this.available = [];
	}

	next() {
		if (this.available.length === 0) this.available = [...this.types];
		for (let index = this.available.length - 1; index > 0; index -= 1) {
			const randomIndex = Math.floor(Math.random() * (index + 1));
			[this.available[index], this.available[randomIndex]] = [
				this.available[randomIndex],
				this.available[index],
			];
		}
		return this.available.pop();
	}

	reset() {
		this.available = [];
	}
}

class PieceFactory {
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

class Board {
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

class GameState {
	constructor() {
		this.highScore = Number(localStorage.getItem('tetris-high-score') || 0);
		this.reset();
	}

	reset() {
		this.score = 0;
		this.lines = 0;
		this.level = 1;
		this.paused = false;
		this.gameOver = false;
	}

	addScore(points) {
		this.score += points;
		if (this.score > this.highScore) {
			this.highScore = this.score;
			localStorage.setItem('tetris-high-score', String(this.highScore));
		}
	}

	addLines(cleared) {
		if (cleared === 0) return;
		this.lines += cleared;
		this.addScore(CONFIG.lineScores[cleared] * this.level);
		this.level = Math.floor(this.lines / 10) + 1;
	}

	getDropInterval() {
		return Math.max(
			CONFIG.minDropInterval,
			CONFIG.baseDropInterval - (this.level - 1) * 60,
		);
	}
}

class Renderer {
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

class Hud {
	constructor(elements, state) {
		this.elements = elements;
		this.state = state;
	}

	update() {
		this.elements.score.textContent = String(this.state.score);
		this.elements.lines.textContent = String(this.state.lines);
		this.elements.level.textContent = String(this.state.level);
		this.elements.highScore.textContent = String(this.state.highScore);
	}

	setStatus(message) {
		this.elements.status.textContent = message;
	}
}

class InputController {
	constructor(game, restartButton) {
		this.game = game;
		this.restartButton = restartButton;
	}

	bind() {
		document.addEventListener('keydown', (event) => {
			if (event.key === ' ') event.preventDefault();
			this.game.handleKey(event.key.toLowerCase());
		});
		this.restartButton.addEventListener('click', () => this.game.reset());
	}
}

class TetrisGame {
	constructor(elements) {
		this.board = new Board(CONFIG.columns, CONFIG.rows);
		this.state = new GameState();
		this.bag = new PieceBag(Object.keys(PIECE_DEFINITIONS));
		this.factory = new PieceFactory(
			PIECE_DEFINITIONS,
			this.bag,
			CONFIG.columns,
		);
		this.renderer = new Renderer(
			elements.board,
			elements.next,
			this.board,
			this.state,
		);
		this.hud = new Hud(elements, this.state);
		this.elements = elements;
		this.currentPiece = null;
		this.nextPiece = null;
		this.lastTime = 0;
		this.dropAccumulator = 0;
	}

	start() {
		this.reset();
		requestAnimationFrame((timestamp) => this.loop(timestamp));
	}

	reset() {
		this.board.reset();
		this.bag.reset();
		this.state.reset();
		this.nextPiece = this.factory.create();
		this.spawnPiece();
		this.dropAccumulator = 0;
		this.hud.update();
		this.hud.setStatus('En juego');
	}

	spawnPiece() {
		this.currentPiece = this.nextPiece || this.factory.create();
		this.nextPiece = this.factory.create();
		this.currentPiece.x = Math.floor(
			(CONFIG.columns - this.currentPiece.shape[0].length) / 2,
		);
		this.currentPiece.y = 0;
		if (this.board.collides(this.currentPiece)) {
			this.state.gameOver = true;
			this.state.paused = false;
			this.hud.setStatus('Game over. Pulsa Reiniciar');
		}
	}

	canPlay() {
		return !this.state.gameOver && !this.state.paused;
	}

	move(offsetX, offsetY) {
		if (
			!this.canPlay() ||
			this.board.collides(this.currentPiece, offsetX, offsetY)
		)
			return false;
		this.currentPiece.x += offsetX;
		this.currentPiece.y += offsetY;
		return true;
	}

	rotate() {
		if (!this.canPlay()) return;
		const rotated = Matrix.rotate(this.currentPiece.shape);
		for (const kick of [0, -1, 1, -2, 2]) {
			if (!this.board.collides(this.currentPiece, kick, 0, rotated)) {
				this.currentPiece.shape = rotated;
				this.currentPiece.x += kick;
				return;
			}
		}
	}

	hardDrop() {
		if (!this.canPlay()) return;
		while (this.move(0, 1)) this.state.addScore(2);
		this.lockPiece();
	}

	lockPiece() {
		this.board.place(this.currentPiece);
		this.state.addLines(this.board.clearCompletedLines());
		this.spawnPiece();
		this.hud.update();
	}

	togglePause() {
		if (this.state.gameOver) return;
		this.state.paused = !this.state.paused;
		this.hud.setStatus(this.state.paused ? 'Pausado' : 'En juego');
	}

	handleKey(key) {
		if (key === 'p') return this.togglePause();
		if (key === 'r') return this.reset();
		if (!this.canPlay()) return;
		switch (key) {
			case 's':
				this.move(-1, 0);
				break;
			case 'f':
				this.move(1, 0);
				break;
			case 'd':
				if (this.move(0, 1)) {
					this.state.addScore(1);
					this.hud.update();
				}
				break;
			case 'l':
			case 'arrowup':
				this.rotate();
				break;
			case 'j':
				this.rotate();
				this.rotate();
				break;
			case 'k':
				this.rotate();
				this.rotate();
				this.rotate();
				break;
			case 'c':
				this.rotate();
				this.rotate();
				break;
			case ' ':
				this.hardDrop();
				break;
			default:
				break;
		}
	}

	loop(timestamp) {
		const deltaTime = timestamp - this.lastTime;
		this.lastTime = timestamp;
		if (this.canPlay()) {
			this.dropAccumulator += deltaTime;
			if (this.dropAccumulator >= this.state.getDropInterval()) {
				this.dropAccumulator = 0;
				if (!this.move(0, 1)) this.lockPiece();
			}
		}
		this.renderer.drawBoard(this.currentPiece);
		this.renderer.drawNextPiece(this.nextPiece);
		requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
	}
}

const elements = {
	board: document.getElementById('board'),
	next: document.getElementById('next'),
	score: document.getElementById('score'),
	lines: document.getElementById('lines'),
	level: document.getElementById('level'),
	highScore: document.getElementById('highScore'),
	status: document.getElementById('status'),
	restart: document.getElementById('restartBtn'),
};

const game = new TetrisGame(elements);
new InputController(game, elements.restart).bind();
game.start();
