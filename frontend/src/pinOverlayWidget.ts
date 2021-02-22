// Copyright (C) 2021 Chronoscope. All rights reserved.

import AnimationInterpolator from './animationInterpolator';

type RenderingContext = CanvasRenderingContext2D;

export default class PinOverlayWidget {
    x: number
    y: number

    rotate: number

    pointingY: number

    fromX: number
    fromY: number
    toX: number
    toY: number

    isVisible: boolean
    scale: number

    constructor() {
        /* coordinate, this pin to be shown */
        this.x = 0;
        this.y = 0;

        this.rotate = 0;

        this.pointingY = 0;

        /* these variables are used only when pin is moving */
        this.fromX = 0;
        this.fromY = 0;
        this.toX = 0;
        this.toY = 0;

        this.isVisible = true;
        this.scale = 1;
    }

    setPointCoord(x: number, y: number) {
        this.x = x;
        this.y = y;

        return this;
    }

    setScale(scale: number) {
        if (scale >= 0) this.scale = scale;

        return this;
    }

    setVisible(visibility: boolean) {
        this.isVisible = visibility;

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
    }

    draw(ctxt: RenderingContext,
         rangeLeft: number, rangeTop: number, mapScale: number) {
        if (!this.isVisible) return;

        ctxt.save();

        const tx = (this.x - rangeLeft) * mapScale;
        const ty = (this.y - rangeTop) * mapScale;

        ctxt.translate(tx, ty);
        ctxt.rotate(this.rotate);

        ctxt.fillStyle = 'rgb(255, 0, 0)';
        ctxt.beginPath();
        ctxt.arc(0, -40 * this.scale, 20 * this.scale, 0, 2 * Math.PI, false);
        ctxt.fill();

        ctxt.beginPath();
        ctxt.moveTo(0, this.pointingY);
        ctxt.lineTo(20 * Math.sin(Math.PI / 3) * this.scale,
                    (-40 + 20 * Math.cos(Math.PI / 3)) * this.scale);
        ctxt.lineTo(-20 * Math.sin(Math.PI / 3) * this.scale,
                    (-40 + 20 * Math.cos(Math.PI / 3)) * this.scale);
        ctxt.fill();

        ctxt.fillStyle = 'rgb(255, 255, 255)';
        ctxt.beginPath();
        ctxt.arc(0, -40 * this.scale, 10 * this.scale, 0, 2 * Math.PI, false);
        ctxt.fill();

        ctxt.restore();
    }
}
