const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const BOARD_WIDTH = COLS * BLOCK_SIZE;
const BOARD_HEIGHT = ROWS * BLOCK_SIZE;
const BASE_DROP_INTERVAL = 800;
const MIN_DROP_INTERVAL = 120;

const boardCanvas = document.getElementById('board');
const boardContext = boardCanvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const highScoreElement = document.getElementById('highScore');
const statusElement = document.getElementById('status');
const restartButton = document.getElementById('restartBtn');

boardCanvas.width = BOARD_WIDTH;
boardCanvas.height = BOARD_HEIGHT;

const PIECES = {
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

const lineScores = [0, 100, 300, 500, 800];
let board = createBoard();
let currentPiece = null;
let nextPiece = null;
let score = 0;
let lines = 0;
let level = 1;
let highScore = Number(localStorage.getItem('tetris-high-score') || 0);
let paused = false;
let gameOver = false;
let lastTime = 0;
let dropAccumulator = 0;

highScoreElement.textContent = String(highScore);

function createBoard() {
	return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function cloneMatrix(matrix) {
	return matrix.map((row) => row.slice());
}

function rotateMatrix(matrix) {
	return matrix[0].map((_, columnIndex) =>
		matrix.map((row) => row[columnIndex]).reverse(),
	);
}

function createPiece(type = randomType()) {
	const base = PIECES[type];
	return {
		type,
		color: base.color,
		shape: cloneMatrix(base.shape),
		x: Math.floor((COLS - base.shape[0].length) / 2),
		y: 0,
	};
}

// Modificar para que utilize BAG de fichas disponibles y ahi selecciona le random en lugar de random total

function randomType() {
	const types = Object.keys(PIECES);
	return types[Math.floor(Math.random() * types.length)];
}

function collides(piece, offsetX = 0, offsetY = 0, testShape = piece.shape) {
	for (let rowIndex = 0; rowIndex < testShape.length; rowIndex += 1) {
		for (
			let columnIndex = 0;
			columnIndex < testShape[rowIndex].length;
			columnIndex += 1
		) {
			if (!testShape[rowIndex][columnIndex]) {
				continue;
			}

			const boardX = piece.x + columnIndex + offsetX;
			const boardY = piece.y + rowIndex + offsetY;

			if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
				return true;
			}

			if (boardY >= 0 && board[boardY][boardX]) {
				return true;
			}
		}
	}

	return false;
}

function placePiece(piece) {
	piece.shape.forEach((row, rowIndex) => {
		row.forEach((cell, columnIndex) => {
			if (!cell) {
				return;
			}

			const boardY = piece.y + rowIndex;
			const boardX = piece.x + columnIndex;

			if (boardY >= 0) {
				board[boardY][boardX] = piece.color;
			}
		});
	});
}

function clearLines() {
	let cleared = 0;

	for (let rowIndex = ROWS - 1; rowIndex >= 0; rowIndex -= 1) {
		if (board[rowIndex].every(Boolean)) {
			board.splice(rowIndex, 1);
			board.unshift(Array(COLS).fill(null));
			cleared += 1;
			rowIndex += 1;
		}
	}

	if (cleared > 0) {
		lines += cleared;
		score += lineScores[cleared] * level;
		level = Math.floor(lines / 10) + 1;
		updateHud();
	}
}

function spawnPiece() {
	currentPiece = nextPiece || createPiece();
	nextPiece = createPiece();

	// No es necesario re declarar esto*
	currentPiece.x = Math.floor((COLS - currentPiece.shape[0].length) / 2);
	currentPiece.y = 0;

	if (collides(currentPiece)) {
		gameOver = true;
		paused = false;
		statusElement.textContent = 'Game over. Pulsa Reiniciar';
	}
}

function hardDrop() {
	if (gameOver || paused) {
		return;
	}

	while (!collides(currentPiece, 0, 1)) {
		currentPiece.y += 1;
		score += 2;
	}

	lockPiece();
}

function lockPiece() {
	placePiece(currentPiece);
	clearLines();
	updateHighScore();
	spawnPiece();
	updateHud();
}

function movePiece(offsetX, offsetY) {
	if (gameOver || paused) {
		return false;
	}

	if (!collides(currentPiece, offsetX, offsetY)) {
		currentPiece.x += offsetX;
		currentPiece.y += offsetY;
		return true;
	}

	return false;
}

function rotatePiece() {
	if (gameOver || paused) {
		return;
	}

	// Arreglar kicks, sistema de kick muy basico, no re evalua posible posición sino que lockea
	// Evaluar Y, actualmente se evalua solo X

	const rotated = rotateMatrix(currentPiece.shape);
	const kicks = [0, -1, 1, -2, 2];

	for (const kick of kicks) {
		if (!collides(currentPiece, kick, 0, rotated)) {
			currentPiece.shape = rotated;
			currentPiece.x += kick;
			return;
		}
	}
}

function updateHighScore() {
	if (score > highScore) {
		highScore = score;
		localStorage.setItem('tetris-high-score', String(highScore));
		highScoreElement.textContent = String(highScore);
	}
}

function updateHud() {
	scoreElement.textContent = String(score);
	linesElement.textContent = String(lines);
	levelElement.textContent = String(level);
	highScoreElement.textContent = String(highScore);
}

function getDropInterval() {
	return Math.max(MIN_DROP_INTERVAL, BASE_DROP_INTERVAL - (level - 1) * 60);
}

function drawCell(context, x, y, color, cellSize) {
	const pixelX = x * cellSize;
	const pixelY = y * cellSize;

	context.fillStyle = color;
	context.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2);

	context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
	context.strokeRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2);
}

function drawBoard() {
	boardContext.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
	boardContext.fillStyle = '#07111f';
	boardContext.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

	for (let y = 0; y < ROWS; y += 1) {
		for (let x = 0; x < COLS; x += 1) {
			if (board[y][x]) {
				drawCell(boardContext, x, y, board[y][x], BLOCK_SIZE);
			} else {
				boardContext.strokeStyle = 'rgba(255, 255, 255, 0.03)';
				boardContext.strokeRect(
					x * BLOCK_SIZE + 0.5,
					y * BLOCK_SIZE + 0.5,
					BLOCK_SIZE,
					BLOCK_SIZE,
				);
			}
		}
	}

	if (currentPiece) {
		const ghostY = getGhostY();
		drawPiece(boardContext, currentPiece, 'rgba(255,255,255,0.18)', ghostY);
		drawPiece(boardContext, currentPiece, currentPiece.color);
	}

	if (paused && !gameOver) {
		overlayMessage('Pausa');
	}

	if (gameOver) {
		overlayMessage('Game Over');
	}
}

function drawPiece(context, piece, color, forcedY = piece.y) {
	piece.shape.forEach((row, rowIndex) => {
		row.forEach((cell, columnIndex) => {
			if (!cell) {
				return;
			}

			const boardX = piece.x + columnIndex;
			const boardY = forcedY + rowIndex;

			if (boardY >= 0) {
				drawCell(context, boardX, boardY, color, BLOCK_SIZE);
			}
		});
	});
}

function getGhostY() {
	let ghostY = currentPiece.y;

	while (!collides(currentPiece, 0, ghostY - currentPiece.y + 1)) {
		ghostY += 1;
	}

	return ghostY;
}

function overlayMessage(message) {
	boardContext.save();
	boardContext.fillStyle = 'rgba(3, 7, 16, 0.62)';
	boardContext.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
	boardContext.fillStyle = '#e9f4ff';
	boardContext.font = 'bold 30px Trebuchet MS, sans-serif';
	boardContext.textAlign = 'center';
	boardContext.fillText(message, BOARD_WIDTH / 2, BOARD_HEIGHT / 2);

	// Averiguar porque tenemos ese restore y save
	boardContext.restore();
}

function drawNextPiece() {
	// Usar constante global
	const previewSize = 30;
	const previewWidth = nextCanvas.width;
	const previewHeight = nextCanvas.height;
	nextContext.clearRect(0, 0, previewWidth, previewHeight);
	nextContext.fillStyle = '#07111f';
	nextContext.fillRect(0, 0, previewWidth, previewHeight);

	if (!nextPiece) {
		return;
	}

	const shape = nextPiece.shape;

	// Ideado solo para cuadrado, ajustar para el resto
	const offsetX = Math.floor((4 - shape[0].length) / 2);
	const offsetY = Math.floor((4 - shape.length) / 2);

	shape.forEach((row, rowIndex) => {
		row.forEach((cell, columnIndex) => {
			if (!cell) {
				return;
			}

			drawCell(
				nextContext,
				offsetX + columnIndex,
				offsetY + rowIndex,
				nextPiece.color,
				previewSize,
			);
		});
	});
}

function resetGame() {
	board = createBoard();
	score = 0;
	lines = 0;
	level = 1;
	paused = false;
	gameOver = false;
	nextPiece = createPiece();
	spawnPiece();
	updateHud();
	statusElement.textContent = 'En juego';
	drawNextPiece();
}

function togglePause() {
	if (gameOver) {
		return;
	}

	paused = !paused;
	statusElement.textContent = paused ? 'Pausado' : 'En juego';
}

function gameLoop(timestamp = 0) {
	const deltaTime = timestamp - lastTime;
	lastTime = timestamp;

	if (!paused && !gameOver) {
		dropAccumulator += deltaTime;

		if (dropAccumulator >= getDropInterval()) {
			dropAccumulator = 0;

			if (!movePiece(0, 1)) {
				lockPiece();
			}
		}
	}

	drawBoard();
	drawNextPiece();
	requestAnimationFrame(gameLoop);
}

// Hacer que puedan oprimirse dos botones de juego simultaneamente

document.addEventListener('keydown', (event) => {
	const key = event.key.toLowerCase();

	if (key === 'p') {
		togglePause();
		return;
	}

	if (key === 'r') {
		resetGame();
		return;
	}

	if (gameOver || paused) {
		return;
	}

	switch (key) {
		case 'arrowleft':
			movePiece(-1, 0);
			break;
		case 'arrowright':
			movePiece(1, 0);
			break;
		case 'arrowdown':
			if (movePiece(0, 1)) {
				score += 1;
				updateHud();
			}
			break;
		case 'arrowup':
		// esta girando solo con oprimir hacia arriba, averiguar porque
		// if (movePiece(0, -2)) {
		// 	score -= 1;
		// 	updateHud();
		// }
		case 'x':
			rotatePiece();
			break;
		case 'z':
			rotatePiece();
			rotatePiece();
			rotatePiece();
			break;
		// Implementado rotar invertir 180*
		// Ajustar por problema con matrices de fichas y posicionamiento en matriz
		case 'c':
			rotatePiece();
			rotatePiece();
			break;

		case ' ':
			event.preventDefault();
			hardDrop();
			break;
		default:
			break;
	}
});

restartButton.addEventListener('click', resetGame);

resetGame();
requestAnimationFrame(gameLoop);
