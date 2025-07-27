/**
 * El tablero es el lugar donde se encuentran las fichas (tiles) y se ejecutan los movimientos
 * que se realizan en el juego. Posee una matriz de slots, que son espacios cuadriculados donde
 * pueden posarse los diferentes tiles
 */

import { Direction } from "./direction.enum";
import { Drawable } from "./drawable.interface";
import { canvas, canvasCtx } from ".";
import { Slot } from "./slot.class";
import { Tile } from "./tile.class";
import { CONFIG } from "./config";

export class Table implements Drawable {
    dimension: number;
    X: number = 0;
    Y: number = 0;

    slots: Slot[][];
    tableInMove: boolean = false;    

    constructor() {
        this.dimension = CONFIG.TABLE.DIMENSION;
        this.slots = [];
        for (let i=0; i<this.dimension; i++) {
            this.slots[i] = [];
            for (let j=0; j<this.dimension; j++) {            
                this.slots[i][j] = new Slot(this, i, j);
            }
        }
    }

    /**
     * Getter que obtiene un arreglo con el total de tiles que existen en el tablero
     */
    get totalTiles() {
        const tiles: Tile[] = [];
        for (let i=0; i<this.dimension; i++) {            
            for (let j=0; j<this.dimension; j++) {
                if (!this.slots[i][j].isEmpty()) {
                    tiles.push(...this.slots[i][j].tiles);
                }
            }
        }
        return tiles;
    }

    get slotWidth() {
        return canvas.width / this.dimension;
    }
    get slotHeight() {
        return canvas.height / this.dimension;
    }

    /**
     * Crea los primeros 2 tiles para empezar el juego
     */
    createFirstTiles() {
        this.createRandomTile();
        this.createRandomTile();
    }

    /**
     * Crea un tile en un slot al azar del tablero que se encuentre vacio
     */
    createRandomTile(value?: number) {
        const emptySlots: Slot[] = [];
        for (let i=0; i<this.dimension; i++) {
            for (let j=0; j<this.dimension; j++) {                    
                if (this.slots[i][j].isEmpty()) {
                    emptySlots.push(this.slots[i][j]);
                }
            }
        }
        const newValue: number = value ? value : Math.random() < 0.9 ? 2 : 4;
        const randomIndex: number = Math.floor(Math.random() * emptySlots.length);        
        const tile = new Tile(emptySlots[randomIndex], newValue);
        tile.scaleAnimation(0, 3);
        emptySlots[randomIndex].addTile(tile);
    }

    /**
     * Método que actualiza los valores de un objeto a dibujar
     */
    act() {
        this.totalTiles.forEach((tile: Tile) => tile.act());        
    }

    /**
     * Metodo que realiza el dibujado de un objeto
     */
    draw() {
        this.drawTable();
        this.totalTiles.forEach((tile: Tile) => tile.draw());
    }

    /**
     * Dibujar el tablero
     */
    drawTable() {
        canvasCtx.fillStyle = CONFIG.TABLE.BKG_COLOR;
        canvasCtx.fillRect(this.X, this.Y, this.slotWidth * this.dimension, this.slotHeight * this.dimension);

        canvasCtx.fillStyle = CONFIG.TABLE.DIV_COLOR; 
        for (let i=0; i<=this.dimension; i++) {
            canvasCtx.fillRect(this.X + this.slotWidth * i - 2, -2, 4, this.slotHeight * this.dimension);
        }
        for (let j=0; j<=this.dimension; j++) {
            canvasCtx.fillRect(-2, this.Y + this.slotHeight * j - 2, this.slotWidth * this.dimension, 4);
        }
    }

    /**
     * Método que trata de realizar un desplazamiento de todos los tiles del tablero solo un paso hacia la dirección elegida.     
     * Entiéndase por un paso a la distancia que va desde un slot hacia el siguiente más cercano.
     * @param direction Dirección hacia la cual se desea realizar el desplazamiento
     * @returns true Si se consiguio desplazar alguno de los tiles, false si no se pudo hacer ningún desplazamiento
     */
    tryMoveOneStepTo(direction: Direction) {
        let someTileMoved = false;
        switch(direction) {
            case Direction.Up:
                for (let j=0; j<this.dimension; j++) {
                    for (let i=0; i<this.dimension; i++) {
                        if (this.slots[i][j].moveUniqueTileTo(direction)) {
                            someTileMoved = true;
                        }
                    }
                }
                break;
            case Direction.Down:
                for (let j=0; j<this.dimension; j++) {
                    for (let i=this.dimension-1; i>=0; i--) {
                        if (this.slots[i][j].moveUniqueTileTo(direction)) {
                            someTileMoved = true;
                        }
                    }
                }
                break;
            case Direction.Left:
                for (let i=0; i<this.dimension; i++) {
                    for (let j=0; j<this.dimension; j++) {                    
                        if (this.slots[i][j].moveUniqueTileTo(direction)) {
                            someTileMoved = true;
                        }
                    }
                }
                break;
            case Direction.Right:
                for (let i=0; i<this.dimension; i++) {
                    for (let j=this.dimension-1; j>=0; j--) {
                        if (this.slots[i][j].moveUniqueTileTo(direction)) {
                            someTileMoved = true;
                        }
                    }
                }
                break;
        }
        return someTileMoved;
    }    

    /**
     * Este método se llama una vez que cualquiera de los tiles llega a su destino (un paso)
     * @param direction Dirección a la cual se realizó el desplazamiento
     */
    oneTileMovedOneStep(direction: Direction) {              
        const someMoved = !!this.totalTiles.find(tile => tile.inMove);
        if (!someMoved) {
            this.allTilesMovedOneStep(direction);
        }
    }

    /**
     * Este método se llama cuando todos los tiles han llegado a su destino (un paso)
     * @param direction Dirección a la cual se realizó el desplazamiento
     */
    allTilesMovedOneStep(direction: Direction) {
        this.doMergers();
        if (!this.tryMoveOneStepTo(direction)) {            
            this.prepareNextTurn();
        }
    }

    /**
     * Realizar las fusiones de tiles en caso ambos sean de igual valor y ocupen el mismo slot
     */
    doMergers() {
        for (let i=0; i<this.dimension; i++) {
            for (let j=0; j<this.dimension; j++) {            
                if (this.slots[i][j].hasTwoEqualTiles()) {
                    this.slots[i][j].mergeTiles();
                }
            }
        }
    }

    /**
     * Prepara el tablero para iniciar un nuevo turno. Esto habilita nuevamente el tablero para
     * que pueda recibir las órdenes de entrada que realice el usuario. Una nueva ficha es creada
     * para empezar el siguiente turno.
     */
    prepareNextTurn() {
        this.totalTiles.forEach(tile => tile.hasBeenMerged = false);
        this.createRandomTile();
        this.tableInMove = false;
    }

}