export default class Hud {
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
