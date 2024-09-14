// Copyright (C) 2021 Chronoscope. All rights reserved.

import axios from 'axios';

import AnimationInterpolator from './animationInterpolator';
import Animator from './animator';
import * as constants from './constants';
import DrawingContext from './drawingContext';
import MapScreenRect from './mapScreenRect';
import NavDrawer from './navDrawer';
import * as networkError from './networkError';
import PinOverlayWidget from './pinOverlayWidget';
import PointingDeviceCoord from './pointingDeviceCoord';
import queryParam from './queryParam';
import { isDirty, invalidate, setInvalidated } from './drawingComponent';

import './ui/css/style.scss';

type RenderingContext = CanvasRenderingContext2D;

let globalDrawingContext: DrawingContext = null;

class MapChunk {
    x: number
    y: number
    image: HTMLImageElement

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.image = new Image;
        this.image.src =
            '/map/' + dimensionName + '/' + x + ',' + y + '.png';
        this.image.addEventListener('load', invalidate);
    }

    draw(ctxt: RenderingContext) {
        if (!this.image.complete || this.image.width === 0) {
            return;
        }

        ctxt.drawImage(
            this.image,
            Math.floor(((this.x - chunkX) * CHUNK_WIDTH - offsetX) * scale),
            Math.floor(((this.y - chunkY) * CHUNK_HEIGHT - offsetY) * scale),
            Math.ceil(CHUNK_WIDTH * scale), Math.ceil(CHUNK_HEIGHT * scale));
    }
}

class Waypoint {
    type: number;
    x: number;
    y: number;
    name: string;
    hira: string;
    color: string;
    detail: string;
    image: string;

    constructor(data: any) {
        this.type = data['type'];
        this.x = data['x'];
        this.y = data['z'];
        this.name = data['name'];
        this.hira = data['hira'];
        this.color = data['color'];
        this.detail = data['detail'];
        this.image = data['image'];
    }

    isInBox(top: number, right: number, bottom: number, left: number) {
        const vpX = left + (right - left) / 2;
        const vpY = top + (bottom - top) / 2;
        const dX = Math.abs(this.x - vpX);
        const dY = Math.abs(this.y - vpY);
        const farX = (right - left) / 2 + MARK_RADIUS;
        const farY = (bottom - top) / 2 + MARK_RADIUS;

        return dX < farX && dY < farY;
    }

    draw(ctxt: RenderingContext, rangeLeft: number, rangeTop: number) {
        if (this.type == 1) {
            ctxt.font = "bold 24px sans-serif";
            const textWidth = ctxt.measureText(this.name).width;
            ctxt.fillStyle = 'rgba(0, 0, 0, .6)';
            ctxt.fillText(this.name,
                          (this.x - rangeLeft) * scale - textWidth / 2 + 2,
                          (this.y - rangeTop) * scale + 2);
            ctxt.fillStyle = 'rgba(255, 255, 255, .6)';
            ctxt.fillText(this.name,
                          (this.x - rangeLeft) * scale - textWidth / 2,
                          (this.y - rangeTop) * scale);
        } else {
            ctxt.fillStyle = 'rgba(0, 0, 0, .3)';
            ctxt.beginPath();
            ctxt.arc((this.x - rangeLeft) * scale + 1,
                     (this.y - rangeTop) * scale + 1, MARK_RADIUS, 0,
                     2 * Math.PI, false);
            ctxt.fill();

            ctxt.fillStyle =
                this.color !== null ? this.color : 'rgb(0, 98, 255)';
            ctxt.beginPath();
            ctxt.arc((this.x - rangeLeft) * scale, (this.y - rangeTop) * scale,
                     MARK_RADIUS, 0, 2 * Math.PI, false);
            ctxt.fill();

            if (this.type === 2 || this.type === 3) {
                let whiteText = false;
                if (this.color !== null) {
                    whiteText = shouldBeWhiteText(this.color);
                }

                let icon = getIcon(this.type, whiteText);
                if (icon !== null) {
                    ctxt.drawImage(
                        icon, (this.x - rangeLeft) * scale - MARK_RADIUS * 0.7,
                        (this.y - rangeTop) * scale - MARK_RADIUS * 0.7, 14,
                        14);
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
let chunkRange: number[] = [ 0, 0, 0, 0 ];

let scale: number = 1.0;
let origScale: number = scale;
let oldDistance: number = 0;
let touchZooming: boolean = false;
let touchZoomCx: number;
let touchZoomCy: number;

let icons = new Array(4).fill(0).map(_ => { return new Array(2); });

const pinWidget = new PinOverlayWidget();

function getDimension(returnString: boolean = false): string | number {
    let dim = queryParam('dim');
    if (dim === '1' || dim === 'nether') return (returnString ? 'nether' : 1);
    if (dim === '2' || dim === 'end') return (returnString ? 'end' : 2);
    return (returnString ? 'overworld' : 0);
}

const dimensionNumber = getDimension();
const dimensionName = getDimension(true);

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

    const newCenterX = x, newCenterY = y;

    const origScale = scale;

    new Animator(constants.MOVE_ANIMATION_DURATION, (ratio: number) => {
        internalCenterizeCoord(oldCenterX + (newCenterX - oldCenterX) * ratio,
                               oldCenterY + (newCenterY - oldCenterY) * ratio);
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
    let icon = new Image;
    if (icons[type][isWhite ? 0 : 1]) {
        const icon = icons[type][isWhite ? 0 : 1];
        if (icon.complete && icon.width !== 0)
            return icons[type][isWhite ? 0 : 1];
        else
            return null;
    }

    icon.src = getIconPath(type, isWhite);
    icon.addEventListener('load', invalidate);
    icons[type][isWhite ? 0 : 1] = icon;

    return null;
}

function retriveChunks() {
    let chunksInRange = [];
    for (let x = chunkX;; ++x) {
        if (((x - chunkX - 1) * CHUNK_WIDTH - offsetX) * scale >= width) break;

        for (let y = chunkY;; ++y) {
            if (((y - chunkY - 1) * CHUNK_HEIGHT - offsetY) * scale >= height)
                break;

            chunksInRange.push([ x, y ]);
        }
    }

    chunksInRange.forEach((e) => {
        if (typeof maps.find((f) => f.x === e[0] && f.y === e[1]) ===
            'undefined') {
            maps.push(new MapChunk(e[0], e[1]));
        }
    });
}

function runCacheGc() {
    for (;;) {
        if (maps.length > (Math.ceil(width / CHUNK_WIDTH / scale) + 1) *
                              (Math.ceil(height / CHUNK_HEIGHT / scale) + 1)) {
            maps.shift();
        } else {
            break;
        }
    }
}

function internalOnDraw() {
    if (!isDirty) {
        if (Math.random() < 0.01) {
            runCacheGc();
        }

        requestAnimationFrame(internalOnDraw);

        return;
    }

    setInvalidated();

    retriveChunks();

    const ctxt = (<HTMLCanvasElement>document.getElementById('map')).getContext('2d');

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
    globalDrawingContext.setCenterCoord(
        rangeLeft + (rangeRight - rangeLeft) / 2,
        rangeTop + (rangeBottom - rangeTop) / 2)
    globalDrawingContext.setSize(rangeRight - rangeLeft,
                                 rangeBottom - rangeTop);
    globalDrawingContext.setMapScale(scale);

    for (let i = 0; i < points.length; ++i) {
        if (points[i].isInBox(rangeTop, rangeRight, rangeBottom, rangeLeft)) {
            points[i].draw(ctxt, rangeLeft, rangeTop);
        }
    }

    pinWidget.draw(globalDrawingContext);

    requestAnimationFrame(internalOnDraw);
}

let canvasRect: DOMRect;

let endCond: any = {};

function adjustCanvas() {
    const canvas = <HTMLCanvasElement>document.getElementById('map');

    width = canvas.clientWidth;
    height = canvas.clientHeight;

    canvas.width = width;
    canvas.height = height;

    const ctxt = canvas.getContext('2d');
    ctxt.imageSmoothingEnabled = false;

    if (globalDrawingContext == null) {
        globalDrawingContext = new DrawingContext(
            ctxt, new MapScreenRect(0, 0, width, height));
    }

    if (width > CHUNK_WIDTH * chunkRange[2]) {
        endCond.chunkX = 0;
        endCond.offsetX = 0;
    } else {
        endCond.chunkX = chunkRange[2] - 1 - Math.floor(width / CHUNK_WIDTH);
        endCond.offsetX = CHUNK_WIDTH - width % CHUNK_WIDTH;
    }

    if (height > CHUNK_HEIGHT * chunkRange[3]) {
        endCond.chunkY = 0;
        endCond.offsetY = 0;
    } else {
        endCond.chunkY = chunkRange[3] - 1 - Math.floor(height / CHUNK_HEIGHT);
        endCond.offsetY = CHUNK_HEIGHT - height % CHUNK_HEIGHT;
    }

    canvasRect = canvas.getBoundingClientRect();
}

function changeCursor(coord: PointingDeviceCoord) {
    const x = Math.floor(coord.x / scale + chunkX * CHUNK_WIDTH + offsetX);
    const y = Math.floor(coord.y / scale + chunkY * CHUNK_HEIGHT + offsetY);

    document.getElementById('coordinate').innerText = 'X=' + x + ' Z=' + y;

    const point =
        points.find((e: Waypoint) => Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2) <=
            (MARK_RADIUS * MARK_RADIUS) / (scale * scale));
    const selecting = typeof point !== 'undefined';

    const canvas = document.getElementById('map');
    canvas.style.cursor = selecting ? 'pointer' : 'move';

    if (selecting) {
        showDescriptionCard(point.name, point.x, false, point.y, point.detail,
                            true);
    } else {
        if (document.getElementById('description-card')
                .classList.contains('auto-hide'))
            hideDescriptionCard();
    }
}

function showDescriptionCard(name: string,
                             x: number | boolean,
                             y: number | boolean,
                             z: number | boolean,
                             detail: string, autoHide = false) {
    const descriptionCard = document.getElementById('description-card');
    let coordinateText = '';
    if (x !== false) coordinateText += 'X=' + x + ' ';
    if (y !== false) coordinateText += 'Y=' + y + ' ';
    if (z !== false) coordinateText += 'Z=' + z + ' ';
    document.getElementById('description-place-name').innerText = name;
    document.getElementById('description-coordinate').innerText =
        coordinateText;
    document.getElementById('description-address').innerText = detail;
    if (autoHide)
        descriptionCard.classList.add('auto-hide');
    else
        descriptionCard.classList.remove('auto-hide');
    descriptionCard.classList.remove('hidden');
}

function hideDescriptionCard() {
    document.getElementById('description-card').classList.remove('auto-hide');
    document.getElementById('description-card').classList.add('hidden');
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

function dragMap(e: PointingDeviceCoord) {
    isMouseMoved = true;
    changeCursor(e);

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

function mouseMove(e: MouseEvent) {
    dragMap(PointingDeviceCoord.wrapMouseEvent(e))
}

function mouseUp() {
    if (!isMouseDown) return;

    isMouseDown = false;
}

function touchStart(e: TouchEvent) {
    dragStart(PointingDeviceCoord.wrapTouchEvent(e));
}

function touchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.changedTouches.length == 1) {
        dragMap(PointingDeviceCoord.wrapTouchEvent(e));
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
            scale = origScale * distance / oldDistance;
            if (scale < MIN_SCALE)
                scale = MIN_SCALE;
            else if (MAX_SCALE < scale)
                scale = MAX_SCALE;
            keepCenter(oScale, scale, touchZoomCx, touchZoomCy);

            document.getElementById('scale').innerText =
                'Scale=' + (Math.floor(scale * 10) / 10);

            invalidate();
        }
    }
};

function touchEnd() {
    mouseUp();
    oldDistance = 0;
    touchZooming = false;
}

function click(e: MouseEvent) {
    if (isMouseMoved) return;

    hideSearchList();
    hideDetailPanel();
    hideContextMenu();

    const x = e.clientX + chunkX * CHUNK_WIDTH + offsetX;
    const y = e.clientY + chunkY * CHUNK_HEIGHT + offsetY;

    const pointId =
        points.findIndex(e => Math.pow(e.x - x, 2) + Math.pow(e.y - y, 2) <=
                              MARK_RADIUS * MARK_RADIUS);
    if (pointId >= 0) {
        goToPoint(pointId);
        hideDescriptionCard();
    } else {
        pinWidget.hide();
        hideDescriptionCard();
    }
};

let contextMenuX: number;
let contextMenuY: number;

function showContextMenu(x: number, y: number) {
    contextMenuX = x;
    contextMenuY = y;
    const menu = document.getElementById('context-menu');
    if (width - x < menu.clientWidth) {
        menu.classList.add('left');
        menu.style.left = 'unset';
        menu.style.right = (width - x) + 'px';
    } else {
        menu.classList.remove('left');
        menu.style.left = x + 'px';
        menu.style.right = 'unset';
    }
    if (height - y < menu.clientHeight) {
        menu.classList.add('up');
        menu.style.top = 'unset';
        menu.style.bottom = (height - y) + 'px';
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
        updateUrl(x, z);

        axios.get('/api/block?x=' + x + '&z=' + z + '&dimen=' + dimensionName)
            .then((response) => {
                const blockInfo = response.data;
                showDetailPanel({
                    name : '指定したポイント',
                    x : x,
                    y : z,
                    type : 1
                });
            })
            .catch((_) => {
                showDetailPanel({
                    name : '指定したポイント',
                    x : x,
                    y : z,
                    type : 1
                });
            });
    }
}

function contextMenu(e: any) {
    showContextMenu(e.x, e.y);
}

let leftOffset: number = 0;

/* cx, cy: 中心として利用する画面上の座標 */
function keepCenter(origScale: number, newScale: number,
                    cx: number, cy: number) {
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

function setScale(oscale: number, nscale: number) {
    if (nscale < MIN_SCALE)
        nscale = MIN_SCALE;
    else if (MAX_SCALE < nscale)
        nscale = MAX_SCALE;

    new Animator(SCALE_ANIMATION_DURATION,
                 (ratio: number) => {
                     const ns = oscale + (nscale - oscale) * ratio;
                     keepCenter(scale, ns, width / 2, height / 2);
                     scale = ns;

                     invalidate();
                 })
        .setAnimationInterpolator(
            AnimationInterpolator.accelerateDeaccelerateInterpolator)
        .start();

    document.getElementById('scale').innerText =
        'Scale=' + (Math.floor(nscale * 10) / 10);
}

function wheel(e: WheelEvent) {
    const origScale = scale;
    scale -= e.deltaY / 200;
    prevX = e.clientX - canvasRect.left;
    prevY = e.clientY - canvasRect.top;

    if (scale < MIN_SCALE)
        scale = MIN_SCALE;
    else if (MAX_SCALE < scale)
        scale = MAX_SCALE;

    keepCenter(origScale, scale, prevX, prevY);

    document.getElementById('scale').innerText =
        'Scale=' + (Math.floor(scale * 10) / 10);

    invalidate();
}

function zoomIn() { setScale(scale, scale + 0.5); }

function zoomOut() { setScale(scale, scale - 0.5); }

function zoomOrig() { setScale(scale, 1); };

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

function initializeSearchList() {
    const template = <HTMLTemplateElement>document.getElementById('search-list-content');
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        // リスト上に表示
        const clone = document.importNode(template.content, true);
        const listItem = <HTMLElement>clone.querySelector('.content');
        const name = <HTMLElement>clone.querySelector('.name');
        const icon = <HTMLImageElement>clone.querySelector('.icon');
        const detail = <HTMLElement>clone.querySelector('.detail');
        const iconPath = getIconPath(point.type);
        name.innerText = point.name;
        detail.innerText = 'X=' + point.x + ' Z=' + point.y;
        listItem.addEventListener('click', () => {
            goToPoint(i);
            hideSearchList();
        });
        if (iconPath) icon.src = iconPath;
        if (point.color) listItem.style.borderLeftColor = point['color'];

        fragment.appendChild(clone);
    }
    document.getElementById('search-list').appendChild(fragment);
}

function loadPoints() {
    axios.get('/api/points?dimen=' + dimensionName)
        .then((response) => {
            points = response.data.map((e: any) => new Waypoint(e));

            const canvas = <HTMLCanvasElement>document.getElementById('map');
            canvas.addEventListener('mousedown', mouseDown);
            canvas.addEventListener('mousemove', mouseMove);
            canvas.addEventListener('mouseup', mouseUp);
            canvas.addEventListener('mouseleave', mouseUp);
            canvas.addEventListener('touchstart', touchStart);
            canvas.addEventListener('touchmove', touchMove);
            canvas.addEventListener('touchend', touchEnd);
            canvas.addEventListener('click', click);
            canvas.addEventListener('wheel', wheel);
            canvas.addEventListener('contextmenu', contextMenu);

            canvas.getContext('2d').imageSmoothingEnabled = false;

            initializeSearchList();

            const paramX = queryParam('x');
            const paramZ = queryParam('z');
            if (paramX !== null && paramZ !== null) {
                const x = parseInt(paramX);
                const z = parseInt(paramZ);
                pinWidget.showAt(x, z);
                centerizeCoord(x, z);
            }

            invalidate();
        })
        .catch((_) => { networkError.show(); });
}

function shouldBeWhiteText(hexcolor: string): boolean {
    var r = parseInt(hexcolor.substring(1, 2), 16);
    var g = parseInt(hexcolor.substring(3, 2), 16);
    var b = parseInt(hexcolor.substring(5, 2), 16);
    return ((((r * 299) + (g * 587) + (b * 114)) / 1000) < 128);
}

let searchListShown: boolean = false;
let detailPanelShown: boolean = false;

function showSearchList() {
    if (searchListShown) return;
    searchListShown = true;

    hideDetailPanel();
    searchPoint();
    document.getElementById('search-panel').classList.remove('hidden');
    document.getElementById('menu-button').classList.add('hidden');
    document.getElementById('search-back-button').classList.remove('hidden');

    const origOffsetX = offsetX;
    const origChunkX = chunkX;

    new Animator(150, (ratio: number) => {
        offsetX = origOffsetX - 210 * ratio / scale;
        chunkX = origChunkX;

        normalizeChunkOffset();

        invalidate();
    }).withEndAction(() => { leftOffset = 210; }).start();
}

function hideSearchList() {
    if (!searchListShown) return;
    searchListShown = false;

    document.getElementById('search-panel').classList.add('hidden');
    document.getElementById('menu-button').classList.remove('hidden');
    document.getElementById('search-back-button').classList.add('hidden');

    const origOffsetX = offsetX;
    const origChunkX = chunkX;

    new Animator(150, (ratio: number) => {
        offsetX = origOffsetX + 210 * ratio / scale;
        chunkX = origChunkX;

        normalizeChunkOffset();

        invalidate();
    }).withEndAction(() => { leftOffset = 0; }).start();
}

function updateUrl(x: number, z: number) {
    history.pushState(null, null,
                      '?dimen=' + dimensionName + '&x=' + x + '&z=' + z);
}

function goToPoint(id: number) {
    const point = points[id];
    pinWidget.showAt(point.x, point.y);
    if (document.body.clientWidth >= 800) {
        centerizeCoord(point.x - 210, point.y);
    } else {
        centerizeCoord(point.x, point.y);
    }
    showDetailPanel(point);
    updateUrl(point.x, point.y);
}

function showDetailPanel(point: any) {
    detailPanelShown = true;
    document.getElementById('search-panel').classList.add('hidden');
    document.getElementById('menu-button').classList.add('hidden');
    document.getElementById('search-back-button').classList.remove('hidden');

    document.getElementById('detail-panel-title').innerText = point['name'];
    document.getElementById('detail-panel-subtitle').innerText =
        'X=' + point['x'] + ', Z=' + point['y'];
    document.getElementById('detail-panel-detail').innerText = point['detail'] ?? '';
    if (point['image']) {
        document.getElementById('detail-panel').classList.remove('no-image');
        document.getElementById('detail-panel-image').style.backgroundImage =
            'url("../images/points/' + point['image'] + '")';
    } else {
        document.getElementById('detail-panel').classList.add('no-image');
    }
    const detailOverview = document.getElementById('detail-panel-overview');
    if (point['color']) {
        detailOverview.style.backgroundColor = point['color'];
        detailOverview.style.color =
            shouldBeWhiteText(point['color']) ? '#fff' : '#000';
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
    document.getElementById('menu-button').classList.remove('hidden');
    document.getElementById('search-back-button').classList.add('hidden');

    document.getElementById('detail-panel')
        .classList.add('compact-detail-panel');
}

function expandDetailPanel() {
    document.getElementById('detail-panel')
        .classList.remove('compact-detail-panel');
    const origOffsetX = offsetX;
    const origChunkX = chunkX;

    new Animator(150, (ratio: number) => {
        offsetX = origOffsetX - 210 * ratio / scale;
        chunkX = origChunkX;

        normalizeChunkOffset();

        invalidate();
    }).withEndAction(() => { leftOffset = 210; }).start();
}

function searchPoint() {
    const searchText = (<HTMLInputElement>document.getElementById('search-box')).value;
    const searchList = document.getElementById('search-list');
    if (searchText) {
        document.getElementById('search-button').classList.add('hidden');
        document.getElementById('search-clear-button')
            .classList.remove('hidden');
    } else {
        document.getElementById('search-button').classList.remove('hidden');
        document.getElementById('search-clear-button').classList.add('hidden');
    }
    for (let i = 0; i < points.length; i++) {
        if (points[i]['name'].indexOf(searchText) !== -1 ||
            points[i]['hira'].indexOf(searchText) !== -1) {
            searchList.children[i].classList.remove('hidden');
        } else {
            searchList.children[i].classList.add('hidden');
        }
    }
}

function handleContextMenu(e: any) {
    hideContextMenu();
    onContextMenuSelected(e.target.id, contextMenuX, contextMenuY);
}

window.addEventListener('load', () => {
    axios.get('/map/' + dimensionName + '/chunk_range.json')
        .then((response) => {
            chunkRange = response.data;
            adjustCanvas();

            initMapPosition();

            requestAnimationFrame(internalOnDraw);

            document.getElementById('zoom-in-button')
                .addEventListener('click', zoomIn);
            document.getElementById('zoom-out-button')
                .addEventListener('click', zoomOut);
            document.getElementById('zoom-orig-button')
                .addEventListener('click', zoomOrig);

            document.getElementById('search-box')
                .addEventListener('click', showSearchList);
            document.getElementById('search-box')
                .addEventListener('input', searchPoint);

            document.getElementById('search-back-button')
                .addEventListener('click', () => {
                    if (searchListShown) {
                        hideSearchList();
                    } else if (detailPanelShown) {
                        if (document.getElementById('detail-panel')
                                .classList.contains('compact-detail-panel')) {
                            hideDetailPanel();
                        } else {
                            document.getElementById('detail-panel')
                                .classList.add('compact-detail-panel');
                            const origOffsetX = offsetX;
                            const origChunkX = chunkX;

                            new Animator(150, (ratio: number) => {
                                offsetX = origOffsetX + 210 * ratio / scale;
                                chunkX = origChunkX;

                                normalizeChunkOffset();

                                invalidate();
                            }).withEndAction(() => { leftOffset = 0; }).start();
                        }
                    }
                });
            document.getElementById('search-button')
                .addEventListener('click', () => {
                    document.getElementById('search-box').focus();
                    showSearchList();
                });
            document.getElementById('search-clear-button')
                .addEventListener('click', () => {
                    (<HTMLInputElement>document.getElementById('search-box')).value = '';
                    searchPoint();
                });
            document.querySelector('.compact-detail-panel')
                .addEventListener('click', expandDetailPanel);

            loadPoints();
        })
        .catch((_) => { networkError.show(); });

    let dimensionText = '';
    if (dimensionNumber === 0) dimensionText = 'Overworld';
    if (dimensionNumber === 1) dimensionText = 'The Nether';
    if (dimensionNumber === 2) dimensionText = 'The End';
    document.getElementById('dimension').innerText = dimensionText;

    new NavDrawer().attach(
        document.getElementById('menu-button'),
        document.getElementById('menu'),
        document.getElementById('menu-modal-back')
    );

    const menuItem =
        document.getElementById('context-menu').querySelectorAll('div');
    for (let i = 0; i < menuItem.length; ++i) {
        if (!menuItem[i].classList.contains('disabled')) {
            menuItem[i].addEventListener('click', handleContextMenu);
        }
    }
});

window.addEventListener('resize', () => {
    adjustCanvas();
    invalidate();
});

window.addEventListener('popstate', () => {
    const paramX = queryParam('x');
    const paramZ = queryParam('z');
    if (paramX === null || paramZ === null) {
        pinWidget.hide();
    } else {
        const x = parseInt(paramX);
        const z = parseInt(paramZ);
        centerizeCoord(x, z);
        pinWidget.showAt(x, z);
    }
});
