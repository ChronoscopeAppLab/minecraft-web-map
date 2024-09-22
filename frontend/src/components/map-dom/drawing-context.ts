import MapScreenRect from './map-screen-rect';
import Rect from './rect';

export default class DrawingContext {
  private renderingContext: CanvasRenderingContext2D;
  private mapScale: number;
  private rect: MapScreenRect;

  constructor(renderingContext: CanvasRenderingContext2D, displayRect: MapScreenRect) {
    this.renderingContext = renderingContext;
    this.rect = displayRect;
    this.mapScale = 1;
  }

  getContext(): CanvasRenderingContext2D {
    return this.renderingContext;
  }

  setMapScale(scale: number) {
    this.mapScale = scale;
  }

  getMapScale(): number {
    return this.mapScale;
  }

  setCenterCoord(x: number, z: number) {
    this.rect.setCenter(x, z);
  }

  setSize(width: number, height: number) {
    this.rect.setSize(width, height);
  }

  getRect(): Rect {
    return this.rect;
  }
}
