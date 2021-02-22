// Copyright (C) 2021 Chronoscope. All rights reserved.

import DrawingContext from './drawingContext';

export let isDirty = true;

export function invalidate() {
    isDirty = true;
}

export function setInvalidated() {
    isDirty = false;
}

export default abstract class Widget {
    abstract draw(dc: DrawingContext): void;
}
