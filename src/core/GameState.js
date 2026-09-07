import CONFIG from '../config/gameConfig.js';

export default class GameState {
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
