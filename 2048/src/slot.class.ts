/**
 * Los slots son las celdas del tablero donde se desplazan los tiles. Un slot puede contener
 * uno o más tiles a la vez, esto para efectos de operaciones como la fusión de tiles.
 */

import { Direction } from "./direction.enum";
import { Table } from "./table.class";
import { Tile } from "./tile.class";

export class Slot {    
    row: number;
    col: number;
    tiles: Tile[] = [];

    _table: Table;    

    constructor(table: Table, row: number, col: number) {
        this.row = row;
        this.col = col;
        this._table = table;        
    }

    /**
     * Getter para obtener la posición X del slot respecto del tablero
     */
    get x() {
        return this._table.X + this.width * this.col;
    }
    /**
     * Getter para obtener la posición Y del slot respecto del tablero
     */
    get y() {
        return this._table.Y + this.height * this.row;
    }
    /**
     * Getter para obtener el tamaño del slot del tablero
     */
    get width() {
        return this._table.slotWidth;
    }

    get height() {
        return this._table.slotHeight;
    }

    /**
     * Verifica que existe otro slot cerca de él en cierta dirección
     * @param direction Direccion usada para la comprobación
     * @returns true Sí existe un slot cercano, false si no existe un slot
     */
    existsNearSlot(direction: Direction) {
        let exists = true;
        switch(direction) {
            case Direction.Up: exists = this.row > 0; break;
            case Direction.Down: exists = this.row < this._table.dimension - 1; break;
            case Direction.Left: exists = this.col > 0; break;
            case Direction.Right: exists = this.col < this._table.dimension - 1; break;
        }
        return exists;
    }

    /**
     * Verifica que el slot está vacío
     * @returns true Si no existen tiles
     */
    isEmpty() {
        return this.tiles.length === 0;
    }

    /**
     * Verifica que el slot tiene un solo tile
     * @returns true Si el slot tiene unicamente un tile
     */
    hasOneTile() {
        return this.tiles.length === 1;
    }

    /**
     * Obtiene el slot que se encuentra cercano a él en cierta dirección
     * @param direction Direccion usada para la obtención
     * @returns slot cercano
     */
    nearSlot(direction: Direction) {        
        switch(direction) {
            case Direction.Up: return this._table.slots[this.row - 1][this.col];
            case Direction.Down: return this._table.slots[this.row + 1][this.col];
            case Direction.Left: return this._table.slots[this.row][this.col - 1];
            case Direction.Right: return this._table.slots[this.row][this.col + 1];
        }
    }

    /**
     * Getter que obtiene el único tile del slot
     */
    get uniqueTile(): Tile {
        return this.tiles[0];
    }

    /**
     * Método que trata de iniciar el desplazamiento del único tile que tiene hacia cierta dirección
     * @param direction Dirección usada para el movimiento
     * @returns true Si se consigue iniciar un desplazamiento, false si no se logro desplazar
     */
    moveUniqueTileTo(direction: Direction): boolean {
        let tileMoved = false;
        if (this.hasOneTile() && this.existsNearSlot(direction)) {
            const nextSlot = this.nearSlot(direction);
            if (this.uniqueTile.canOccupy(nextSlot)) {
                this.uniqueTile.moveOneStepTo(nextSlot, direction);
                tileMoved = true;
            }            
        }
        return tileMoved;
    }

    /**
     * Agrega un tile al areglo de tiles del slot
     * @param tile Tile a agregar
     */
    addTile(tile: Tile) {
        this.tiles.push(tile);
    }

    /**
     * Elimina un tile del arreglo de tiles del slot
     * @param tile Tile a eliminar
     */
    deleteTile(tile: Tile) {
        this.tiles.splice(this.tiles.indexOf(tile), 1);
    }

    /**
     * Verifica que el slot tiene 2 tiles del mismo valor
     * @returns true si el slot tiene 2 tiles de igual valor, false en caso contrario
     */
    hasTwoEqualTiles() {
        return this.tiles.length === 2 && this.tiles[0].value === this.tiles[1].value;
    }

    /**
     * Realiza la fusión de tiles dentro del slot
     */
    mergeTiles() {
        const value = this.tiles[0].value;
        this.deleteTile(this.tiles[1]);
        this.deleteTile(this.tiles[0]);
        const tile = new Tile(this, value * 2, true);        
        tile.mergeAnimation();
        this.addTile(tile);
    }
}