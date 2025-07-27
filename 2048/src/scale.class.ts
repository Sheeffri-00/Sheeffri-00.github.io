import { Tile } from "./tile.class";

export class Scale {

    currX: number;
    currY: number;
    velX: number;
    velY: number;

    constructor(private _tile: Tile, private props: {
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        duration: number,
        onFinish: () => void
    }) {
        this.currX = this.props.startX;
        this.currY = this.props.startY;
        const dx = this.props.endX - this.currX;
        const dy = this.props.endY - this.currY;
        this.velX = ((this.props.endX - this.props.startX) / this.props.duration) / 5;
        this.velY = ((this.props.endY - this.props.startY) / this.props.duration) / 5;        
    }

    act() {
        this.currX += this.velX;
        this.currY += this.velY;        
        const signX = this.props.startX <= this.props.endX ? 1 : -1;
        const signY = this.props.startY <= this.props.endY ? 1 : -1;
        
        let finished = false;
        if (signX * (this.props.endX - this.currX) <= 0 && signY * (this.props.endY - this.currY) <= 0) {
            this.currX = this.props.endX;
            this.currY = this.props.endY;
            finished = true;
        }

        this._tile.scaleX = this.currX;
        this._tile.scaleY = this.currY;

        if (finished) {
            this.props.onFinish();
        }
    }
}