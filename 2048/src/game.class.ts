/**
 * La clase Game es la clase que gestiona el juego. Aqui se revisan inputs, se disparan acciones,
 * y se gestionan condiciones de iniciación, derrota y victoria.
 */

import { Direction } from "./direction.enum";
import { canvas, canvasCtx } from ".";
import { Table } from "./table.class";

export class Game {

    table: Table;
    started = false;

    constructor() {        
    }

    /**
     * Inicia el juego preparando los objetos y variables
     */
    start() {
        this.table = new Table();
        this.table.createFirstTiles();        
        this.started = true;
    }

    /**
     * Realiza el renderizado de la aplicación. Realiza una llamada a los métodos act 
     * y draw de todos los objetos existentes
     */
    render() {
        this.clearScreen();
        this.table.act();
        this.table.draw();
    }

    /**
     * Limpieza de la pantalla
     */
    clearScreen() {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Revisa las órdenes recibidas por el usuario
     * @param direction Dirección de la orden
     * @returns 
     */
    checkOrderTo(direction: Direction) {
        if (this.table.tableInMove) return;
        if (this.table.tryMoveOneStepTo(direction)) {
            this.table.tableInMove = true;
        }
    }

    
}