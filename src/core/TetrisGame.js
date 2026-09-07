import Board from '../board/Board.js';
import CONFIG from '../config/gameConfig.js';
import PIECE_DEFINITIONS from '../config/piecesConfig.js';
import Matrix from '../pieces/Matrix.js';
import PieceBag from '../pieces/PieceBag.js';
import PieceFactory from '../pieces/PieceFactory.js';
import Renderer from '../rendering/Rendering.js';
import Hud from '../ui/Hud.js';
import GameState from './GameState.js';

export default class TetrisGame {
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
