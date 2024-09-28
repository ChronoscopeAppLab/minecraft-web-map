import Rect from './rect';

export default class MapScreenRect implements Rect {
  private top: number = 0;
  private right: number = 0;
  private bottom: number = 0;
  private left: number = 0;

  private cx: number;
  private cy: number;

  constructor(cx: number, cy: number, width: number, height: number) {
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
