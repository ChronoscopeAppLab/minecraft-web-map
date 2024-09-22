export default class PointingDeviceCoord {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static wrapMouseEvent(e: MouseEvent): PointingDeviceCoord {
    return new PointingDeviceCoord(e.clientX, e.clientY);
  }

  static wrapTouchEvent(e: TouchEvent): PointingDeviceCoord {
    let touch = e.changedTouches[0];
    return new PointingDeviceCoord(touch.clientX, touch.clientY);
  }
}
