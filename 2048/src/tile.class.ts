/**
 * Un Tile es una ficha del tablero que tiene un valor y ocupa algún slot. Posee métodos y propiedades
 * para realizar efectos de traslado, escalamiento, etc. Es un ente que sabe dibujarse.
 */

import { Direction } from "./direction.enum";
import { Drawable } from "./drawable.interface";
import { canvasCtx } from ".";
import { Move } from "./move.class";
import { Scale } from "./scale.class";
import { Slot } from "./slot.class";
import { CONFIG } from "./config";

export class Tile implements Drawable {    
    value: number;
    color: string;
    hasBeenMerged = false;

    private _slot: Slot;
    move: Move | null = null;
    scale: Scale | null = null;    
    scaleX: number = 1;
    scaleY: number = 1;

    constructor(slot: Slot, value: number, hasBeenMerged: boolean = false) {
        this.value = value;
        this.color = this.getColor(value);
        this.hasBeenMerged = hasBeenMerged;
        this.setSlot(slot);
    }

    /**
     * Getter para verificar que existe un movimiento programado
     */
    get inMove(): boolean {
        return this.move !== null;
    }
    /**
     * Getter para obtener la posición X de su slot contenedor
     */
    get slotX() {
        return this._slot.x;
    }
    /**
     * Getter para obtener la posición Y de su slot contenedor
     */
    get slotY() {
        return this._slot.y;
    }

    /**
     * Obtiene un valor de color según el valor del tile
     * @param value Valor del slot
     * @returns string El color asignado para cierto valor de Tile en código hexadecimal
     */
    private getColor(value: number): string {
        switch(value) {
            case 2: return CONFIG.TILE.COLORS.COLOR_2;
            case 4: return CONFIG.TILE.COLORS.COLOR_4;
            case 8: return CONFIG.TILE.COLORS.COLOR_8;
            case 16: return CONFIG.TILE.COLORS.COLOR_16;
            case 32: return CONFIG.TILE.COLORS.COLOR_32;
            case 64: return CONFIG.TILE.COLORS.COLOR_64;
            case 128: return CONFIG.TILE.COLORS.COLOR_128;
            case 256: return CONFIG.TILE.COLORS.COLOR_256;
            case 512: return CONFIG.TILE.COLORS.COLOR_512;
            case 1024: return CONFIG.TILE.COLORS.COLOR_1024;
            case 2048: return CONFIG.TILE.COLORS.COLOR_2048;
            default: return CONFIG.TILE.COLORS.COLOR_DEFAULT;
        }
    }

    /**
     * Getter que obtiene el orden de un valor del tile. Matemáticamente hablando el
     * resultado del logaritmo de su valor en base 2 (Ej. Para 128 el orden es 7)
     */
    get valueOrder() {
        return Math.log(this.value) / Math.log(2);
    }

    /**
     * Programa un efecto de escalamiento en el Tile
     * @param startingScale Escala inicial del efecto
     * @param duration duración del efecto
     */
    scaleAnimation(startingScale: number, duration: number) {
        this.scaleX = startingScale;        
        this.scaleY = startingScale;
        this.scale = new Scale(this, {
            startX: startingScale,
            startY: startingScale,
            endX: 1,
            endY: 1,
            duration: duration,
            onFinish: () => {
                this.scaleX = 1;
                this.scaleY = 1;
                this.scale = null;
            }
        });
    }

    mergeAnimation() {
        this.scaleX = 1;
        this.scaleY = 1;
        this.scale = new Scale(this, {
            startX: 1,
            startY: 1,
            endX: 1.08 + this.valueOrder * 0.02,
            endY: 1.08 + this.valueOrder * 0.02,
            duration: 0.5 + this.valueOrder * 0.05,
            onFinish: () => {
                this.scale = new Scale(this, {
                    startX: this.scale.currX,
                    startY: this.scale.currY,
                    endX: 1,
                    endY: 1,
                    duration: 0.5 + this.valueOrder * 0.05,
                    onFinish: () => {
                        this.scale = null;
                    }
                })
            }
        })
    }

    get X() {
        return this.move !== null ? this.move.currX : this.slotX;
    }
    get Y() {
        return this.move !== null ? this.move.currY : this.slotY;
    }

    /**
     * Método que actualiza los valores de un objeto a dibujar
     */
    act() {
        if (this.move !== null) {
            this.move.act();      
        }
        if (this.scale !== null) {
            this.scale.act();
        }
    }

    /**
     * Metodo que realiza el dibujado de un objeto
     */
    draw() {
        canvasCtx.translate(this.X + this._slot.width / 2, this.Y + this._slot.height / 2);
        canvasCtx.scale(this.scaleX, this.scaleY);

        canvasCtx.fillStyle = this.getColor(this.value);
        canvasCtx.fillRect(-this._slot.width / 2 + 2, -this._slot.height / 2 + 2, this._slot.width - 4, this._slot.height - 4);        

        canvasCtx.fillStyle = this.value < 5 ? '#000000' : '#FFFFFF';
        const fontSize = 8 + Math.abs(this._slot.width / ((''+this.value).length * 0.3 + 3));
        canvasCtx.font = `${fontSize}px Arial`;
        canvasCtx.textAlign = 'center';
        canvasCtx.textBaseline = 'middle';
        canvasCtx.fillText(''+this.value, 0, 0);

        canvasCtx.scale(1, 1);
        canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    }

    /**
     * Getter para obtener el valor de fila en funcion de su slot
     */
    get row() {
        return this._slot.row;
    }
    /**
     * Getter para obtener el valor de columna en funcion de su slot
     */
    get col() {
        return this._slot.col;
    }

    /**
     * 
     * @param slot Metodo que verifica si un tile puede ocupar o no cierto slot.
     * @returns true Si es posible ocupar dicho slot, false si el slot no puede ser ocupado por el tile
     */
    canOccupy(slot: Slot) {
        return slot.isEmpty() || (slot.hasOneTile() && (slot.uniqueTile.inMove 
                || (slot.uniqueTile.value === this.value && !slot.uniqueTile.hasBeenMerged && !this.hasBeenMerged)));
    }

    /**
     * Método que programa el desplazamiento del tile hacia cierto slot que se encontraba en cierta dirección
     * @param slot Slot hacia donde se programó el desplazamiento
     * @param direction Dirección hacia donde se programó el desplazamiento
     */
    moveOneStepTo(slot: Slot, direction: Direction) {        
        this.move = new Move(this, {
            startX: this.slotX,
            startY: this.slotY,
            endX: slot.x,
            endY: slot.y,
            onFinish: () => {                
                this.onTileStepped(slot, direction);
            }
        });
    }

    /**
     * Método que es llamado una vez el tile termina de hacer el desplazamiento previamente programado
     * @param slot Slot hacia donde se programó el desplazamiento
     * @param direction Dirección hacia donde se programó el desplazamiento
     */
    onTileStepped(slot: Slot, direction: Direction) {
        this.move = null;
        this.changeSlot(slot);
        this._slot._table.oneTileMovedOneStep(direction);
    }

    /**
     * Método que realiza el cambio del slot a uno nuevo (Como cuando el tile ha hecho un desplazamiento
     * y necesita indicar que ha pasado a un nuevo slot)
     * @param newSlot El nuevo slot que será el contenedor de este tile
     */
    changeSlot(newSlot: Slot) {
        this._slot.deleteTile(this);
        newSlot.addTile(this);
        this.setSlot(newSlot);
    }

    /**
     * Cambia el valor de la variable _slot del tile
     * @param slot El nuevo slot que será el contenedor de este tile
     */
    setSlot(slot: Slot) {
        this._slot = slot;
    }
}