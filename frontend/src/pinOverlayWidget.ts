import AnimationInterpolator from './animationInterpolator';
import Animator from './animator';
import * as constants from './constants';
import DrawingComponent from './drawingComponent';
import { invalidate } from './drawingComponent';
import DrawingContext from './drawingContext';

export default class PinOverlayWidget extends DrawingComponent {
    private x: number;
    private y: number;

    private pointingY: number;

    private fromX: number;
    private fromY: number;
    private toX: number;
    private toY: number;

    private isVisible: boolean;
    private scale: number;

    constructor() {
        super();

        /* coordinate, this pin to be shown */
        this.x = 0;
        this.y = 0;

        this.pointingY = 0;

        /* these variables are used only when pin is moving */
        this.fromX = 0;
        this.fromY = 0;
        this.toX = 0;
        this.toY = 0;

        this.isVisible = false;
        this.scale = 1;
    }

    setPointCoord(x: number, y: number) {
        this.x = x;
        this.y = y;

        return this;
    }

    showAt(x: number, y: number) {
        if (this.getIsVisible()) {
            this.setMoveTarget(x, y);

            new Animator(1000,
                         (ratio: number) => {
                             this.move(ratio);
                         })
                .setDelay(250)
                .setAnimationInterpolator(
                    AnimationInterpolator.accelerateDeaccelerateInterpolator)
                .start();
        } else {
            this.setPointCoord(x, y).setScale(0).setVisible(true);

            new Animator(300,
                         (ratio: number) => {
                             this.setScale(ratio);
                         })
                .setDelay(constants.MOVE_ANIMATION_DURATION)
                .setAnimationInterpolator(
                    AnimationInterpolator.overshootInterpolator)
                .start();
        }
    }

    hide() {
        new Animator(100,
                     (ratio: number) => {
                         this.setScale(ratio);
                     })
            .reversed()
            .withEndAction(() => {
                this.setVisible(false);
            })
            .start();
    }

    setScale(scale: number) {
        if (scale >= 0) this.scale = scale;
        invalidate();

        return this;
    }

    setVisible(visibility: boolean) {
        this.isVisible = visibility;
        invalidate();

        return this;
    }

    getIsVisible() { return this.isVisible; }

    setMoveTarget(x: number, y: number) {
        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = x;
        this.toY = y;

        return this;
    }

    move(ratio: number) {
        if (ratio < 0.1) {
            const trueratio = ratio / 0.1;

            this.pointingY = -20 * trueratio;
        } else if (0.1 <= ratio && ratio < 0.9) {
            const trueratio = (ratio - 0.1) / 0.8;

            this.x = this.fromX + (this.toX - this.fromX) * trueratio;
            this.y = this.fromY + (this.toY - this.fromY) * trueratio -
                200 *
                AnimationInterpolator.swanDiveInterpolator(trueratio) /
                this.scale;
        } else {
            const trueratio = (ratio - 0.9) / 0.1;

            this.pointingY = -20 * (1 - trueratio);
        }

        invalidate();
    }

    draw(dc: DrawingContext) {
        if (!this.isVisible) return;

        const ctxt = dc.getContext();

        ctxt.save();

        const rect = dc.getRect();
        const scale = dc.getMapScale();

        // Calculate targeting coordinate in the display.
        const tx = (this.x - rect.getLeft()) * scale;
        const ty = (this.y - rect.getTop()) * scale;

        ctxt.translate(tx, ty);

        ctxt.fillStyle = 'rgb(255, 0, 0)';
        ctxt.beginPath();
        ctxt.arc(0, -40 * this.scale, 20 * this.scale, 0, 2 * Math.PI);
        ctxt.fill();

        ctxt.beginPath();
        ctxt.moveTo(0, this.pointingY);
        ctxt.lineTo(20 * Math.sin(Math.PI / 3) * this.scale,
                    -(40 - 20 * Math.cos(Math.PI / 3)) * this.scale);
        ctxt.lineTo(-20 * Math.sin(Math.PI / 3) * this.scale,
                    -(40 - 20 * Math.cos(Math.PI / 3)) * this.scale);
        ctxt.fill();

        ctxt.fillStyle = 'rgb(255, 255, 255)';
        ctxt.beginPath();
        ctxt.arc(0, -40 * this.scale, 10 * this.scale, 0, 2 * Math.PI);
        ctxt.fill();

        ctxt.restore();
    }
}
