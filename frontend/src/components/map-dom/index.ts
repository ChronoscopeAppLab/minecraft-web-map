import AnimationInterpolator from './animation-interpolator';
import Animator from './animator';
import * as constants from './constants';
import DrawingContext from './drawing-context';
import MapScreenRect from './map-screen-rect';
import PinOverlayWidget from './pin-overlay-widget';
import PointingDeviceCoord from './pointing-device-coord';
import {isDirty, invalidate, setInvalidated} from './drawing-component';
import {Spot} from '../../api/types';
import Stats from 'stats.js';
import MapRenderer from './map-renderer';

const CHUNK_WIDTH: number = 512;
const CHUNK_HEIGHT: number = 512;

const MARK_RADIUS: number = 10;
const SCALE_ANIMATION_DURATION: number = 500;

const MIN_SCALE = 0.3;
const MAX_SCALE = 10.0;

let globalDrawingContext: DrawingContext = null;

class MapChunk {
  x: number;
  y: number;
  image: HTMLImageElement;

  constructor(prefix: string, dimension: string, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.image = new Image();
    this.image.src = `${prefix}/${dimension}/${x},${y}.png`;
    this.image.addEventListener('load', invalidate);
  }

  draw(ctxt: CanvasRenderingContext2D) {
    if (!this.image.complete || this.image.width === 0) {
      return;
    }

    ctxt.drawImage(
      this.image,
      Math.floor(((this.x - chunkX) * CHUNK_WIDTH - offsetX) * scale),
      Math.floor(((this.y - chunkY) * CHUNK_HEIGHT - offsetY) * scale),
      Math.ceil(CHUNK_WIDTH * scale),
      Math.ceil(CHUNK_HEIGHT * scale)
    );
  }
}

class Waypoint {
  spot: Spot;

  constructor(spot: Spot) {
    this.spot = spot;
  }

  isInBox(top: number, right: number, bottom: number, left: number) {
    const vpX = left + (right - left) / 2;
    const vpY = top + (bottom - top) / 2;
    const dX = Math.abs(this.spot.x - vpX);
    const dY = Math.abs(this.spot.z - vpY);
    const farX = (right - left) / 2 + MARK_RADIUS;
    const farY = (bottom - top) / 2 + MARK_RADIUS;

    return dX < farX && dY < farY;
  }

  draw(ctxt: CanvasRenderingContext2D, rangeLeft: number, rangeTop: number) {
    if (this.spot.type == 1) {
      ctxt.font = 'bold 24px sans-serif';
      const textWidth = ctxt.measureText(this.spot.name).width;
      ctxt.fillStyle = 'rgba(0, 0, 0, .6)';
      ctxt.fillText(this.spot.name, (this.spot.x - rangeLeft) * scale - textWidth / 2 + 2, (this.spot.z - rangeTop) * scale + 2);
      ctxt.fillStyle = 'rgba(255, 255, 255, .6)';
      ctxt.fillText(this.spot.name, (this.spot.x - rangeLeft) * scale - textWidth / 2, (this.spot.z - rangeTop) * scale);
    } else {
      ctxt.fillStyle = 'rgba(0, 0, 0, .3)';
      ctxt.beginPath();
      ctxt.arc((this.spot.x - rangeLeft) * scale + 1, (this.spot.z - rangeTop) * scale + 1, MARK_RADIUS, 0, 2 * Math.PI, false);
      ctxt.fill();

      ctxt.fillStyle = this.spot.color !== null ? this.spot.color : 'rgb(0, 98, 255)';
      ctxt.beginPath();
      ctxt.arc((this.spot.x - rangeLeft) * scale, (this.spot.z - rangeTop) * scale, MARK_RADIUS, 0, 2 * Math.PI, false);
      ctxt.fill();

      if (this.spot.type === 2 || this.spot.type === 3) {
        let whiteText = false;
        if (this.spot.color !== null) {
          whiteText = shouldBeWhiteText(this.spot.color);
        }

        let icon = getIcon(this.spot.type, whiteText);
        if (icon !== null) {
          ctxt.drawImage(icon, (this.spot.x - rangeLeft) * scale - MARK_RADIUS * 0.7, (this.spot.z - rangeTop) * scale - MARK_RADIUS * 0.7, 14, 14);
        }
      }
    }
  }
}

let chunkX: number = 0;
let chunkY: number = 0;
let offsetX: number = 0;
let offsetY: number = 0;

let scale: number = 1.0;
let origScale: number = scale;
let oldDistance: number = 0;
let touchZooming: boolean = false;
let touchZoomCx: number;
let touchZoomCy: number;

let icons = new Array(4).fill(0).map((_) => {
  return new Array(2);
});

const pinWidget = new PinOverlayWidget();

function getIconPath(type: number, isWhite: boolean = false): string {
  if (type < 2 || 3 < type) return;

  if (type === 2) {
    return isWhite ? '/images/train_white.png' : '/images/train.png';
  } else if (type === 3) {
    return isWhite ? '/images/subway_white.png' : '/images/subway.png';
  }
}

function getIcon(type: number, isWhite: boolean = false): HTMLImageElement {
  let icon = new Image();
  if (icons[type][isWhite ? 0 : 1]) {
    const icon = icons[type][isWhite ? 0 : 1];
    if (icon.complete && icon.width !== 0) return icons[type][isWhite ? 0 : 1];
    else return null;
  }

  icon.src = getIconPath(type, isWhite);
  icon.addEventListener('load', invalidate);
  icons[type][isWhite ? 0 : 1] = icon;

  return null;
}

let canvasRect: DOMRect;

let isMouseDown: boolean;
let isMouseMoved: boolean;
let prevX: number;
let prevY: number;

let leftOffset: number = 0;

const shouldBeWhiteText = (hexcolor: string): boolean => {
  var r = parseInt(hexcolor.substring(1, 2), 16);
  var g = parseInt(hexcolor.substring(3, 2), 16);
  var b = parseInt(hexcolor.substring(5, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 20;
};

export type MapOptions = {
  perf?: boolean;
  canvas: HTMLCanvasElement;
  prefix: string;
  dimension: 'overworld' | 'nether' | 'end';
  spots: Spot[];
  callback: {
    onHoverSpot?: (spot: Spot | null) => void;
    onSelectSpot?: (spot: (Partial<Spot> & Pick<Spot, 'name' | 'x' | 'z' | 'type'>) | null) => void;
    openContextMenu?: (x: number, y: number) => void;
    closeContextMenu?: () => void;
    showError: () => void;
  };
};

export class Map {
  private options: MapOptions;

  private canvas: HTMLCanvasElement;
  private spots: Spot[];
  private frameRequestId: number | null;

  private stats: Stats;

  private maps: MapChunk[] = [];
  private points: Waypoint[] = [];

  private width: number;
  private height: number;

  private renderer: MapRenderer;

  constructor() {
    this.stats = new Stats();
  }

  private handleResize() {
    this.adjustCanvas(this.canvas);
    invalidate();
  }

  private async init() {
    this.adjustCanvas(this.canvas);

    this.initMapPosition();

    this.frameRequestId = requestAnimationFrame(this.mainLoop.bind(this));

    this.setupListners(this.canvas);
    this.points = this.spots.map((spot: Spot) => new Waypoint(spot));

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  public async bind(options: MapOptions) {
    this.options = options;

    this.canvas = options.canvas;
    this.spots = options.spots;

    if (options.perf) {
      this.stats.showPanel(0);
      document.body.appendChild(this.stats.dom);
    }

    this.renderer = new MapRenderer(`${options.prefix}/overworld`, this.canvas.clientWidth, this.canvas.clientHeight, 1, 0, 0);
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    this.renderer.update();

    this.init();
  }

  public unbind() {
    removeEventListener('resize', this.handleResize.bind(this));
    if (this.frameRequestId !== null) {
      cancelAnimationFrame(this.frameRequestId);
    }
  }

  private setScale(oscale: number, nscale: number) {
    if (nscale < MIN_SCALE) {
      nscale = MIN_SCALE;
    } else if (MAX_SCALE < nscale) {
      nscale = MAX_SCALE;
    }

    new Animator(SCALE_ANIMATION_DURATION, (ratio: number) => {
      const ns = oscale + (nscale - oscale) * ratio;
      this.keepCenter(scale, ns, this.width / 2, this.height / 2);
      scale = ns;

      this.renderer.setScale(scale);
      this.renderer.update();

      invalidate();
    })
      .setAnimationInterpolator(AnimationInterpolator.accelerateDeaccelerateInterpolator)
      .start();
  }

  zoomIn() {
    this.setScale(scale, scale + 0.5);
  }

  zoomOut() {
    this.setScale(scale, scale - 0.5);
  }

  zoomOrig() {
    this.setScale(scale, 1);
  }

  private mainLoop() {
    this.stats.begin();

    // if (!isDirty) {
    //   this.frameRequestId = requestAnimationFrame(this.mainLoop.bind(this));

    //   this.stats.end();
    //   return;
    // }

    setInvalidated();

    const ctxt = this.canvas.getContext('2d');

    ctxt.clearRect(0, 0, this.width, this.height);

    this.renderer.renderTo(ctxt);

    // this.retriveChunks();

    // const ctxt = this.canvas.getContext('2d');

    // ctxt.clearRect(0, 0, this.width, this.height);

    // for (let i = 0; i < this.maps.length; ++i) {
    //   const imageChunk = this.maps.shift();
    //   imageChunk.draw(ctxt);
    //   this.maps.push(imageChunk);
    // }

    /* スケールする前の範囲（points.json の内容をそのまま使うため） */
    const rangeLeft = chunkX * CHUNK_WIDTH + offsetX;
    const rangeRight = rangeLeft + this.width / scale;
    const rangeTop = chunkY * CHUNK_HEIGHT + offsetY;
    const rangeBottom = rangeTop + this.height / scale;

    // // XXX
    // globalDrawingContext.setCenterCoord(rangeLeft + (rangeRight - rangeLeft) / 2, rangeTop + (rangeBottom - rangeTop) / 2);
    // globalDrawingContext.setSize(rangeRight - rangeLeft, rangeBottom - rangeTop);
    // globalDrawingContext.setMapScale(scale);

    for (let i = 0; i < this.points.length; ++i) {
      if (this.points[i].isInBox(rangeTop, rangeRight, rangeBottom, rangeLeft)) {
        this.points[i].draw(ctxt, rangeLeft, rangeTop);
      }
    }

    pinWidget.draw(globalDrawingContext);

    this.frameRequestId = requestAnimationFrame(this.mainLoop.bind(this));

    this.stats.end();
  }

  focusPoint(id: number) {
    const point = this.points[id];
    pinWidget.showAt(point.spot.x, point.spot.z);

    if (document.body.clientWidth >= 800) {
      this.centerizeCoord(point.spot.x - 210, point.spot.z);
    } else {
      this.centerizeCoord(point.spot.x, point.spot.z);
    }

    this.options.callback.onSelectSpot(point.spot);
  }

  private click(e: MouseEvent) {
    if (isMouseMoved) return;

    this.options.callback.onSelectSpot(null);
    this.options.callback.closeContextMenu();

    const x = e.clientX + chunkX * CHUNK_WIDTH + offsetX;
    const y = e.clientY + chunkY * CHUNK_HEIGHT + offsetY;

    const pointId = this.points.findIndex((e) => Math.pow(e.spot.x - x, 2) + Math.pow(e.spot.z - y, 2) <= MARK_RADIUS * MARK_RADIUS);
    if (pointId >= 0) {
      this.focusPoint(pointId);
      this.options.callback.onHoverSpot(null);
    } else {
      pinWidget.hide();
      this.options.callback.onHoverSpot(null);
    }
  }

  private wheel(e: WheelEvent) {
    const origScale = scale;
    scale -= e.deltaY / 200;
    prevX = e.clientX - canvasRect.left;
    prevY = e.clientY - canvasRect.top;

    if (scale < MIN_SCALE) {
      scale = MIN_SCALE;
    } else if (MAX_SCALE < scale) {
      scale = MAX_SCALE;
    }

    this.keepCenter(origScale, scale, prevX, prevY);

    invalidate();
  }

  private dragMap(e: PointingDeviceCoord) {
    isMouseMoved = true;

    const x = Math.floor(e.x / scale + chunkX * CHUNK_WIDTH + offsetX);
    const y = Math.floor(e.y / scale + chunkY * CHUNK_HEIGHT + offsetY);

    const point = this.points.find(
      (e: Waypoint) => Math.pow(e.spot.x - x, 2) + Math.pow(e.spot.z - y, 2) <= (MARK_RADIUS * MARK_RADIUS) / (scale * scale)
    );
    const selecting = typeof point !== 'undefined';

    if (selecting) {
      this.options.callback.onHoverSpot(point.spot);
    } else {
      this.options.callback.onHoverSpot(null);
    }

    if (!isMouseDown) return;

    const currentX = e.x - canvasRect.left;
    const currentY = e.y - canvasRect.top;

    if (!touchZooming) {
      const moveX = (prevX - currentX) / scale;
      const moveY = (prevY - currentY) / scale;

      offsetX += moveX;
      offsetY += moveY;
    }

    this.normalizeChunkOffset();

    invalidate();

    prevX = currentX;
    prevY = currentY;
  }

  private mouseMove(e: MouseEvent) {
    this.dragMap(PointingDeviceCoord.wrapMouseEvent(e));
  }

  private mouseUp() {
    if (!isMouseDown) return;

    isMouseDown = false;
  }

  private touchStart(e: TouchEvent) {
    this.dragStart(PointingDeviceCoord.wrapTouchEvent(e));
  }

  private touchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.changedTouches.length == 1) {
      this.dragMap(PointingDeviceCoord.wrapTouchEvent(e));
    } else {
      const touches = e.changedTouches;
      const x1 = touches[0].clientX - canvasRect.left,
        y1 = touches[0].clientY - canvasRect.top,
        x2 = touches[1].clientX - canvasRect.left,
        y2 = touches[1].clientY - canvasRect.top,
        distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        oScale = scale;

      if (!oldDistance) {
        touchZoomCx = (x1 + x2) / 2;
        touchZoomCy = (y1 + y2) / 2;
        touchZooming = true;
        oldDistance = distance;
        origScale = scale;
      } else {
        scale = (origScale * distance) / oldDistance;
        if (scale < MIN_SCALE) scale = MIN_SCALE;
        else if (MAX_SCALE < scale) scale = MAX_SCALE;
        this.keepCenter(oScale, scale, touchZoomCx, touchZoomCy);

        invalidate();
      }
    }
  }

  private touchEnd() {
    this.mouseUp();
    oldDistance = 0;
    touchZooming = false;
  }

  private setupListners(canvas: HTMLCanvasElement) {
    canvas.addEventListener('mousedown', this.mouseDown.bind(this));
    canvas.addEventListener('mousemove', this.mouseMove.bind(this));
    canvas.addEventListener('mouseup', this.mouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.mouseUp.bind(this));
    canvas.addEventListener('touchstart', this.touchStart.bind(this));
    canvas.addEventListener('touchmove', this.touchMove.bind(this));
    canvas.addEventListener('touchend', this.touchEnd.bind(this));
    canvas.addEventListener('click', this.click.bind(this));
    canvas.addEventListener('wheel', this.wheel.bind(this));
    canvas.addEventListener('contextmenu', this.contextMenu.bind(this));

    canvas.getContext('2d').imageSmoothingEnabled = false;

    invalidate();
  }

  focusPosition(px: number, py: number) {
    const x = Math.floor(px / scale + chunkX * CHUNK_WIDTH + offsetX);
    const z = Math.floor(py / scale + chunkY * CHUNK_HEIGHT + offsetY);
    pinWidget.showAt(x, z);
    if (document.body.clientWidth >= 800) {
      this.centerizeCoord(x - 210, z);
    } else {
      this.centerizeCoord(x, z);
    }

    this.options.callback.onSelectSpot({
      name: '指定したポイント',
      x: x,
      z: z,
      type: 1
    });
  }

  private contextMenu(e: any) {
    e.preventDefault();
    this.options.callback.openContextMenu(e.x, e.y);
  }

  private retriveChunks() {
    let chunksInRange = [];
    for (let x = chunkX; ; ++x) {
      if (((x - chunkX - 1) * CHUNK_WIDTH - offsetX) * scale >= this.width) break;

      for (let y = chunkY; ; ++y) {
        if (((y - chunkY - 1) * CHUNK_HEIGHT - offsetY) * scale >= this.height) break;

        chunksInRange.push([x, y]);
      }
    }

    chunksInRange.forEach((e) => {
      if (typeof this.maps.find((f) => f.x === e[0] && f.y === e[1]) === 'undefined') {
        this.maps.push(new MapChunk(this.options.prefix, this.options.dimension, e[0], e[1]));
      }
    });
  }

  private initMapPosition() {
    switch (this.options.dimension) {
      case 'overworld':
        offsetX = 0;
        offsetY = 0;
      case 'nether':
        chunkX = -3;
        chunkY = 3;
      case 'end':
        chunkX = -1;
        chunkY = -1;
    }
  }

  private dragStart(e: PointingDeviceCoord) {
    isMouseDown = true;
    isMouseMoved = false;
    prevX = e.x - canvasRect.left;
    prevY = e.y - canvasRect.top;
  }

  private mouseDown(e: MouseEvent) {
    this.dragStart(PointingDeviceCoord.wrapMouseEvent(e));
  }

  private internalCenterizeCoord(x: number, y: number) {
    chunkX = 0;
    chunkY = 0;
    offsetX = x - this.width / 2 / scale;
    offsetY = y - this.height / 2 / scale;

    this.normalizeChunkOffset();
  }

  private centerizeCoord(x: number, y: number) {
    const oldCenterX = chunkX * CHUNK_WIDTH + offsetX + this.width / 2,
      oldCenterY = chunkY * CHUNK_HEIGHT + offsetY + this.height / 2;

    const newCenterX = x,
      newCenterY = y;

    const origScale = scale;

    new Animator(constants.MOVE_ANIMATION_DURATION, (ratio: number) => {
      this.internalCenterizeCoord(oldCenterX + (newCenterX - oldCenterX) * ratio, oldCenterY + (newCenterY - oldCenterY) * ratio);
      const newScale = origScale - 0.25 + (ratio - 0.5) * (ratio - 0.5);
      this.keepCenter(scale, newScale, this.width / 2, this.height / 2);
      scale = newScale;

      invalidate();
    }).start();
  }

  private adjustCanvas(canvas: HTMLCanvasElement) {
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;

    canvas.width = this.width;
    canvas.height = this.height;

    const ctxt = canvas.getContext('2d');
    ctxt.imageSmoothingEnabled = false;

    if (globalDrawingContext == null) {
      globalDrawingContext = new DrawingContext(ctxt, new MapScreenRect(0, 0, this.width, this.height));
    }

    canvasRect = canvas.getBoundingClientRect();
  }

  /*  0 <= offset_{x,y} < CHUNK_{WIDTH,HEIGHT} になるように調整する。
   描画範囲が画面の範囲を超えている場合に範囲を動かす。 */
  private normalizeChunkOffset() {
    for (;;) {
      if (offsetX >= CHUNK_WIDTH) {
        offsetX -= CHUNK_WIDTH;
        ++chunkX;
      } else if (offsetX < 0) {
        offsetX += CHUNK_WIDTH;
        --chunkX;
      } else {
        break;
      }
    }

    for (;;) {
      if (offsetY >= CHUNK_HEIGHT) {
        offsetY -= CHUNK_HEIGHT;
        ++chunkY;
      } else if (offsetY < 0) {
        offsetY += CHUNK_HEIGHT;
        --chunkY;
      } else {
        break;
      }
    }
  }

  /* cx, cy: 中心として利用する画面上の座標 */
  private keepCenter(origScale: number, newScale: number, cx: number, cy: number) {
    /* 中央の座標を保持しつつ origScale から newScale にサイズを変更したとき，
       左上の座標は，もとの左上の座標と中央の座標の間の origscale/newScale
       の割合の位置に移動する */

    /* 1. もとのスケールでの左上からマウスまでの（スケールしてない場合の）距離を
       x, y それぞれについて求める */
    const origLenToCenterX = (cx + leftOffset) / origScale;
    const origLenToCenterY = cy / origScale;

    /* 2. 新たな左上から中央の長さを求める */
    const newLenToCenterX = origLenToCenterX * (origScale / newScale);
    const newLenToCenterY = origLenToCenterY * (origScale / newScale);

    /* 3. スケール前後の左上から中央への長さの差を描画オフセットに加える */
    offsetX += origLenToCenterX - newLenToCenterX;
    offsetY += origLenToCenterY - newLenToCenterY;

    /* 4. オフセットをチャンクに反映 */
    this.normalizeChunkOffset();
  }
}
