export default class InputController {
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
