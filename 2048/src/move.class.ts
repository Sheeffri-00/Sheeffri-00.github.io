import { Tile } from "./tile.class";

export class Move {
    currX: number;
    currY: number;    
    velX: number;
    velY: number;

    constructor(private _tile: Tile, private props: {
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        onFinish: () => void
    }) {
        this.currX = props.startX;
        this.currY = props.startY;
        const dx = this.props.endX - this.currX;
        const dy = this.props.endY - this.currY;
        this.velX = (this.props.endX - this.props.startX) / 5;
        this.velY = (this.props.endY - this.props.startY) / 5;
    }

    act() {
        this.currX += this.velX;
        this.currY += this.velY;
        const dx = Math.abs(this.props.endX - this.currX);
        const dy = Math.abs(this.props.endY - this.currY);
        
        if (dx <= 0.1 && dy <= 0.1) {
            this.currX = this.props.endX;
            this.currY = this.props.endY;
            this.props.onFinish();
        }
    }
}