import InputController from './core/InputController.js';
import TetrisGame from './core/TetrisGame.js';
import elements from './ui/DOMElements.js';

const game = new TetrisGame(elements);
new InputController(game, elements.restart).bind();
game.start();
