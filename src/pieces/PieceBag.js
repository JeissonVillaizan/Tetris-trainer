export default class PieceBag {
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
