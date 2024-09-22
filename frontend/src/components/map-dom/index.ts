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

let globalDrawingContext: DrawingContext = null;

class MapChunk {
  x: number;
  y: number;
  image: HTMLImageElement;

  constructor(prefix: string, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.image = new Image();
    this.image.src = `${prefix}/${dimensionName}/${x},${y}.png`;
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

const CHUNK_WIDTH: number = 512;
const CHUNK_HEIGHT: number = 512;

const MARK_RADIUS: number = 10;
const SCALE_ANIMATION_DURATION: number = 500;

const MIN_SCALE = 0.3;
const MAX_SCALE = 10.0;

let maps: MapChunk[] = [];
let width: number;
let height: number;
let chunkX: number = 0;
let chunkY: number = 0;
let offsetX: number = 0;
let offsetY: number = 0;

let points: Waypoint[] = [];
let chunkRange: number[] = [0, 0, 0, 0];

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

function getDimension(): number {
  const params = new URLSearchParams(window.location.search);
  let dim = params.get('dimen');
  switch (dim) {
    case 'overworld':
      return 0;
    case 'nether':
      return 1;
    case 'end':
      return 2;
  }
  return 0;
}

const dimensionNumber = getDimension();
const dimensionName = ['overworld', 'nether', 'end'][dimensionNumber];

function internalCenterizeCoord(x: number, y: number) {
  chunkX = 0;
  chunkY = 0;
  offsetX = x - width / 2 / scale;
  offsetY = y - height / 2 / scale;

  normalizeChunkOffset();
}

function centerizeCoord(x: number, y: number) {
  const oldCenterX = chunkX * CHUNK_WIDTH + offsetX + width / 2,
    oldCenterY = chunkY * CHUNK_HEIGHT + offsetY + height / 2;

  const newCenterX = x,
    newCenterY = y;

  const origScale = scale;

  new Animator(constants.MOVE_ANIMATION_DURATION, (ratio: number) => {
    internalCenterizeCoord(oldCenterX + (newCenterX - oldCenterX) * ratio, oldCenterY + (newCenterY - oldCenterY) * ratio);
    const newScale = origScale - 0.25 + (ratio - 0.5) * (ratio - 0.5);
    keepCenter(scale, newScale, width / 2, height / 2);
    scale = newScale;

    invalidate();
  }).start();
}

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

function retriveChunks(prefix: string) {
  let chunksInRange = [];
  for (let x = chunkX; ; ++x) {
    if (((x - chunkX - 1) * CHUNK_WIDTH - offsetX) * scale >= width) break;

    for (let y = chunkY; ; ++y) {
      if (((y - chunkY - 1) * CHUNK_HEIGHT - offsetY) * scale >= height) break;

      chunksInRange.push([x, y]);
    }
  }

  chunksInRange.forEach((e) => {
    if (typeof maps.find((f) => f.x === e[0] && f.y === e[1]) === 'undefined') {
      maps.push(new MapChunk(prefix, e[0], e[1]));
    }
  });
}

let canvasRect: DOMRect;

let endCond: any = {};

function adjustCanvas(canvas: HTMLCanvasElement) {
  width = canvas.clientWidth;
  height = canvas.clientHeight;

  canvas.width = width;
  canvas.height = height;

  const ctxt = canvas.getContext('2d');
  ctxt.imageSmoothingEnabled = false;

  if (globalDrawingContext == null) {
    globalDrawingContext = new DrawingContext(ctxt, new MapScreenRect(0, 0, width, height));
  }

  if (width > CHUNK_WIDTH * chunkRange[2]) {
    endCond.chunkX = 0;
    endCond.offsetX = 0;
  } else {
    endCond.chunkX = chunkRange[2] - 1 - Math.floor(width / CHUNK_WIDTH);
    endCond.offsetX = CHUNK_WIDTH - (width % CHUNK_WIDTH);
  }

  if (height > CHUNK_HEIGHT * chunkRange[3]) {
    endCond.chunkY = 0;
    endCond.offsetY = 0;
  } else {
    endCond.chunkY = chunkRange[3] - 1 - Math.floor(height / CHUNK_HEIGHT);
    endCond.offsetY = CHUNK_HEIGHT - (height % CHUNK_HEIGHT);
  }

  canvasRect = canvas.getBoundingClientRect();
}

let isMouseDown: boolean;
let isMouseMoved: boolean;
let prevX: number;
let prevY: number;

function dragStart(e: PointingDeviceCoord) {
  isMouseDown = true;
  isMouseMoved = false;
  prevX = e.x - canvasRect.left;
  prevY = e.y - canvasRect.top;
}

function mouseDown(e: MouseEvent) {
  dragStart(PointingDeviceCoord.wrapMouseEvent(e));
}

/*  0 <= offset_{x,y} < CHUNK_{WIDTH,HEIGHT} になるように調整する。
   描画範囲が画面の範囲を超えている場合に範囲を動かす。 */
function normalizeChunkOffset() {
  for (;;) {
    if (chunkX < endCond.chunkX && offsetX >= CHUNK_WIDTH) {
      offsetX -= CHUNK_WIDTH;
      ++chunkX;
    } else if (chunkX > chunkRange[0] && offsetX < 0) {
      offsetX += CHUNK_WIDTH;
      --chunkX;
    } else {
      if (chunkX <= chunkRange[0] && offsetX < 0) {
        chunkX = chunkRange[0];
        offsetX = 0;
      } else if (chunkX >= endCond.chunkX && offsetX > endCond.offsetX) {
        chunkX = endCond.chunkX;
        offsetX = endCond.offsetX;
      }

      break;
    }
  }

  for (;;) {
    if (chunkY < endCond.chunkY && offsetY >= CHUNK_HEIGHT) {
      offsetY -= CHUNK_HEIGHT;
      ++chunkY;
    } else if (chunkY > chunkRange[1] && offsetY < 0) {
      offsetY += CHUNK_HEIGHT;
      --chunkY;
    } else {
      if (chunkY <= chunkRange[1] && offsetY < 0) {
        chunkY = chunkRange[1];
        offsetY = 0;
      } else if (chunkY >= endCond.chunkY && offsetY > endCond.offsetY) {
        chunkY = endCond.chunkY;
        offsetY = endCond.offsetY;
      }

      break;
    }
  }
}

let contextMenuX: number;
let contextMenuY: number;

function showContextMenu(x: number, y: number) {
  contextMenuX = x;
  contextMenuY = y;
  const menu = document.getElementById('context-menu');
  if (width - x < menu.clientWidth) {
    menu.classList.add('left');
    menu.style.left = 'unset';
    menu.style.right = width - x + 'px';
  } else {
    menu.classList.remove('left');
    menu.style.left = x + 'px';
    menu.style.right = 'unset';
  }
  if (height - y < menu.clientHeight) {
    menu.classList.add('up');
    menu.style.top = 'unset';
    menu.style.bottom = height - y + 'px';
  } else {
    menu.classList.remove('up');
    menu.style.top = y + 'px';
    menu.style.bottom = 'unset';
  }

  menu.classList.remove('invisible');
}

function hideContextMenu() {
  const menu = document.getElementById('context-menu');
  menu.classList.add('invisible');
}

function onContextMenuSelected(id: string, menuX: number, menuY: number) {
  if (id === 'select-point') {
    hideDetailPanel();
    const x = Math.floor(menuX / scale + chunkX * CHUNK_WIDTH + offsetX);
    const z = Math.floor(menuY / scale + chunkY * CHUNK_HEIGHT + offsetY);
    pinWidget.showAt(x, z);
    if (document.body.clientWidth >= 800) {
      centerizeCoord(x - 210, z);
    } else {
      centerizeCoord(x, z);
    }

    showDetailPanel({
      name: '指定したポイント',
      x: x,
      z: z,
      type: 1
    });
  }
}

function contextMenu(e: any) {
  showContextMenu(e.x, e.y);
}

let leftOffset: number = 0;

/* cx, cy: 中心として利用する画面上の座標 */
function keepCenter(origScale: number, newScale: number, cx: number, cy: number) {
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
  normalizeChunkOffset();
}

function initMapPosition() {
  if (dimensionNumber === 0) {
    chunkX = -3;
    chunkY = 3;
  } else {
    chunkX = -1;
    chunkY = -1;
  }

  offsetX = 0;
  offsetY = 0;
}

function shouldBeWhiteText(hexcolor: string): boolean {
  var r = parseInt(hexcolor.substring(1, 2), 16);
  var g = parseInt(hexcolor.substring(3, 2), 16);
  var b = parseInt(hexcolor.substring(5, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

let detailPanelShown: boolean = false;

function showDetailPanel(spot: Partial<Spot> & Pick<Spot, 'name' | 'x' | 'z' | 'type'>) {
  detailPanelShown = true;
  document.getElementById('detail-panel-title').innerText = spot['name'];
  document.getElementById('detail-panel-subtitle').innerText = 'X=' + spot['x'] + ', Z=' + spot['z'];
  document.getElementById('detail-panel-detail').innerText = spot['detail'] ?? '';
  if (spot.image) {
    document.getElementById('detail-panel').classList.remove('no-image');
    document.getElementById('detail-panel-image').style.backgroundImage = 'url("../images/points/' + spot['image'] + '")';
  } else {
    document.getElementById('detail-panel').classList.add('no-image');
  }
  const detailOverview = document.getElementById('detail-panel-overview');
  if (spot.color) {
    detailOverview.style.backgroundColor = spot['color'];
    detailOverview.style.color = shouldBeWhiteText(spot['color']) ? '#fff' : '#000';
  } else {
    detailOverview.style.backgroundColor = 'rgb(0, 98, 255)';
    detailOverview.style.color = '#fff';
  }
  document.getElementById('detail-panel').classList.remove('hidden');
}

function hideDetailPanel() {
  if (!detailPanelShown) return true;
  detailPanelShown = false;
  document.getElementById('detail-panel').classList.add('hidden');

  document.getElementById('detail-panel').classList.add('compact-detail-panel');
}

function handleContextMenu(e: any) {
  hideContextMenu();
  onContextMenuSelected(e.target.id, contextMenuX, contextMenuY);
}

export type MapOptions = {
  perf?: boolean;
  canvas: HTMLCanvasElement;
  prefix: string;
  spots: Spot[];
  callback: {
    onHoverSpot?: (spot: Spot | null) => void;
    showError: () => void;
  };
};

export class Map {
  private options: MapOptions;

  private canvas: HTMLCanvasElement;
  private spots: Spot[];
  private frameRequestId: number | null;

  private stats: Stats;

  constructor() {
    this.stats = new Stats();
  }

  private handleResize() {
    adjustCanvas(this.canvas);
    invalidate();
  }

  private async init() {
    try {
      chunkRange = await fetch(`${this.options.prefix}/${dimensionName}/chunk_range.json`).then((resp) => resp.json());
    } catch (e) {
      this.options.callback.showError();
      return;
    }

    adjustCanvas(this.canvas);

    initMapPosition();

    this.frameRequestId = requestAnimationFrame(this.mainLoop.bind(this));

    this.setupListners(this.canvas);
    points = this.spots.map((spot: Spot) => new Waypoint(spot));

    const menuItem = document.getElementById('context-menu').querySelectorAll('div');
    for (let i = 0; i < menuItem.length; ++i) {
      if (!menuItem[i].classList.contains('disabled')) {
        menuItem[i].addEventListener('click', handleContextMenu);
      }
    }

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
      keepCenter(scale, ns, width / 2, height / 2);
      scale = ns;

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

    if (!isDirty) {
      this.frameRequestId = requestAnimationFrame(this.mainLoop.bind(this));

      this.stats.end();
      return;
    }

    setInvalidated();

    retriveChunks(this.options.prefix);

    const ctxt = this.canvas.getContext('2d');

    ctxt.clearRect(0, 0, width, height);

    for (let i = 0; i < maps.length; ++i) {
      const imageChunk = maps.shift();
      imageChunk.draw(ctxt);
      maps.push(imageChunk);
    }

    /* スケールする前の範囲（points.json の内容をそのまま使うため） */
    const rangeLeft = chunkX * CHUNK_WIDTH + offsetX;
    const rangeRight = rangeLeft + width / scale;
    const rangeTop = chunkY * CHUNK_HEIGHT + offsetY;
    const rangeBottom = rangeTop + height / scale;

    // XXX
    globalDrawingContext.setCenterCoord(rangeLeft + (rangeRight - rangeLeft) / 2, rangeTop + (rangeBottom - rangeTop) / 2);
    globalDrawingContext.setSize(rangeRight - rangeLeft, rangeBottom - rangeTop);
    globalDrawingContext.setMapScale(scale);

    for (let i = 0; i < points.length; ++i) {
      if (points[i].isInBox(rangeTop, rangeRight, rangeBottom, rangeLeft)) {
        points[i].draw(ctxt, rangeLeft, rangeTop);
      }
    }

    pinWidget.draw(globalDrawingContext);

    this.frameRequestId = requestAnimationFrame(this.mainLoop.bind(this));

    this.stats.end();
  }

  focusPoint(id: number) {
    const point = points[id];
    pinWidget.showAt(point.spot.x, point.spot.z);

    if (document.body.clientWidth >= 800) {
      centerizeCoord(point.spot.x - 210, point.spot.z);
    } else {
      centerizeCoord(point.spot.x, point.spot.z);
    }

    showDetailPanel(point.spot);
  }

  private click(e: MouseEvent) {
    if (isMouseMoved) return;

    hideDetailPanel();
    hideContextMenu();

    const x = e.clientX + chunkX * CHUNK_WIDTH + offsetX;
    const y = e.clientY + chunkY * CHUNK_HEIGHT + offsetY;

    const pointId = points.findIndex((e) => Math.pow(e.spot.x - x, 2) + Math.pow(e.spot.z - y, 2) <= MARK_RADIUS * MARK_RADIUS);
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

    keepCenter(origScale, scale, prevX, prevY);

    invalidate();
  }

  private dragMap(e: PointingDeviceCoord) {
    isMouseMoved = true;

    const x = Math.floor(e.x / scale + chunkX * CHUNK_WIDTH + offsetX);
    const y = Math.floor(e.y / scale + chunkY * CHUNK_HEIGHT + offsetY);

    const point = points.find(
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

    normalizeChunkOffset();

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
    dragStart(PointingDeviceCoord.wrapTouchEvent(e));
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
        keepCenter(oScale, scale, touchZoomCx, touchZoomCy);

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
    canvas.addEventListener('mousedown', mouseDown);
    canvas.addEventListener('mousemove', this.mouseMove.bind(this));
    canvas.addEventListener('mouseup', this.mouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.mouseUp.bind(this));
    canvas.addEventListener('touchstart', this.touchStart.bind(this));
    canvas.addEventListener('touchmove', this.touchMove.bind(this));
    canvas.addEventListener('touchend', this.touchEnd.bind(this));
    canvas.addEventListener('click', this.click.bind(this));
    canvas.addEventListener('wheel', this.wheel.bind(this));
    canvas.addEventListener('contextmenu', contextMenu);

    canvas.getContext('2d').imageSmoothingEnabled = false;

    invalidate();
  }
}
