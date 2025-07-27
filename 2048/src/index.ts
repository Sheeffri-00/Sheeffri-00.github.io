/**
 * Archivo principal donde inicia el programa. Aquí se obtiene el contexto de canvas,
 * se instancia la clase Game y se registran los eventos de entrada. 
 */

import './styles.css';
import { Direction } from "./direction.enum";
import { Game } from "./game.class";

// Se obtiene el contexto de canvas
export const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('gameCanvas');
export const canvasCtx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvasContainer');

// Valor de la relación de aspecto entre el ancho y el alto
const aspectRatio = 1;

// Función que escala el aspecto de canvas según su contenedor padre
function sizeCanvas() {
    if (canvas) {
        canvas.width = canvasContainer.offsetWidth;
        canvas.height = aspectRatio * canvas.width;        
    }
}

sizeCanvas();

// Redimensionar canvas cuando haya un resize en el navegador
window.addEventListener('resize', () => sizeCanvas());

// Se instancia la clase Game y se inicia
const game: Game = new Game();
game.start();

// Teclado ingresado por el usuario
document.addEventListener('keydown', (event: KeyboardEvent) => {
    event.preventDefault();
    var key = event.key;
    if (key === 'ArrowLeft') { // Izquierda
        game.checkOrderTo(Direction.Left);
    } else if (key === 'ArrowUp') { // Arriba
        game.checkOrderTo(Direction.Up);
    } else if (key === 'ArrowRight') { // Derecha
        game.checkOrderTo(Direction.Right);
    } else if (key === 'ArrowDown') { // Abajo
        game.checkOrderTo(Direction.Down);
    }
});

// Drag ingresado por el usuario
let dragStartX = null;
let dragStartY = null;
document.body.addEventListener('touchstart', (e: TouchEvent) => {
    e.preventDefault();
    console.log('start', e);
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
});
document.body.addEventListener('touchmove', (e: TouchEvent) => {
    e.preventDefault();
    const dragX = e.touches[0].clientX;
    const dragY = e.touches[0].clientY;
    if (!!dragStartY &&dragY - dragStartY >= 12) {
        dragStartX = dragX;
        dragStartY = dragY;
        game.checkOrderTo(Direction.Down);
    } else if (!!dragStartY && dragY - dragStartY <= -12) {
        dragStartX = dragX;
        dragStartY = dragY;
        game.checkOrderTo(Direction.Up);
    }
    if (!!dragStartX && dragX - dragStartX >= 12) {
        dragStartX = dragX;
        dragStartY = dragY;
        game.checkOrderTo(Direction.Right);        
    } else if (!!dragStartX && dragX - dragStartX <= -12) {
        dragStartX = dragX;
        dragStartY = dragY;
        game.checkOrderTo(Direction.Left);
    }    
});

// Botón de reinicio
document.querySelector('.restart').addEventListener('click', (e: MouseEvent) => {
    e.preventDefault();
    game.start();
});

// Loop principal del juego 
function render() {
    if (game && game.started) {
        game.render();
    }
    requestAnimationFrame(render);
}

render();