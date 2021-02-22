// Copyright (C) 2021 Chronoscope. All rights reserved.

import Rect from './rect';

export default class MapScreenRect implements Rect {
    private top: number;
    private right: number;
    private bottom: number;
    private left: number;

    private cx: number;
    private cy: number;

    constructor(cx: number, cy: number,
                width: number, height: number) {
        this.cx = cx;
        this.cy = cy;
        this.setSize(width, height);
    }

    getTop(): number {
        return this.top;
    }

    getRight(): number {
        return this.right;
    }

    getBottom(): number {
        return this.bottom;
    }

    getLeft(): number {
        return this.left;
    }

    getWidth(): number {
        return this.right - this.left;
    }

    getHeight(): number {
        return this.top - this.bottom;
    }

    setSize(width: number, height: number) {
        let halfWidth = width / 2;
        let halfHeight = height / 2;

        this.top = this.cy - halfHeight;
        this.right = this.cx + halfWidth;
        this.bottom = this.cy + halfHeight;
        this.left = this.cx - halfWidth;
    }

    setCenter(cx: number, cy: number) {
        this.cx = cx;
        this.cy = cy;

        this.setSize(this.getWidth(), this.getHeight());
    }
}
