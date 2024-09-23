const TILE_SIZE = 512;

const computeTileNumber = (pos: number): number => {
  if (pos < 0) {
    Math.floor(pos / TILE_SIZE) - 1;
  }

  return Math.floor(pos / TILE_SIZE);
};

class MapRenderer {
  private baseUri: string;

  private canvas: OffscreenCanvas;

  private width: number = 0;
  private height: number = 0;
  private scale: number = 0;

  private cx: number = 0;
  private cy: number = 0;

  private initialized: boolean = false;
  private l: number = 0;
  private r: number = 0;
  private t: number = 0;
  private b: number = 0;

  constructor(baseUri: string, width: number, height: number, scale: number, cx: number, cy: number) {
    this.baseUri = baseUri;
    this.canvas = new OffscreenCanvas(512, 512);

    this.width = width;
    this.height = height;
    this.scale = scale;
    this.cx = cx;
    this.cy = cy;
  }

  private loadToCanvas() {
    const l = computeTileNumber((this.cx - this.width / 2) / this.scale);
    const r = computeTileNumber((this.cx + this.width / 2) / this.scale);
    const t = computeTileNumber((this.cy - this.height / 2) / this.scale);
    const b = computeTileNumber((this.cy + this.height / 2) / this.scale);

    if (this.initialized && l === this.l && r === this.r && t === this.t && b === this.b) {
      // Range hasn't changed. No need to update.
      return;
    }

    const newCanvas = new OffscreenCanvas((r - l + 1) * TILE_SIZE, (b - t + 1) * TILE_SIZE);
    const ctxt = newCanvas.getContext('2d');
    ctxt.imageSmoothingEnabled = false;

    // Copy existing canvas to new canvas
    ctxt.drawImage(this.canvas, (this.l - l) * TILE_SIZE, (this.t - t) * TILE_SIZE);

    // Load new tiles
    for (let x = l; x <= r; x++) {
      for (let y = t; y <= b; y++) {
        if (this.initialized && this.l <= x && x <= this.r && this.t <= y && y <= this.b) {
          // Tile already loaded
          continue;
        }

        const tile = new Image();
        tile.src = `${this.baseUri}/${x},${y}.png`;
        tile.onload = () => {
          ctxt.drawImage(tile, (x - l) * TILE_SIZE, (y - t) * TILE_SIZE);
        };
      }
    }

    this.canvas = newCanvas;
    this.initialized = true;
    this.l = l;
    this.r = r;
    this.t = t;
    this.b = b;
  }

  public setScreenSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public setScale(scale: number) {
    this.scale = scale;
  }

  public moveCenter(dx: number, dy: number) {
    this.cx += dx;
    this.cy += dy;
  }

  public update() {
    this.loadToCanvas();
  }

  public renderTo(ctxt: CanvasRenderingContext2D) {
    const localL = computeTileNumber((this.cx - this.width / 2) / this.scale) * TILE_SIZE;
    const localT = computeTileNumber((this.cy - this.height / 2) / this.scale) * TILE_SIZE;
    const displayL = (this.cx - this.width / 2) / this.scale;
    const displayT = (this.cy - this.width / 2) / this.scale;

    const dx = displayL - localL;
    const dy = displayT - localT;

    ctxt.drawImage(this.canvas, dx, dy, this.width / this.scale, this.height / this.scale, 0, 0, this.width, this.height);
  }
}

export default MapRenderer;
