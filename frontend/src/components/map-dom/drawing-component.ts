import DrawingContext from './drawing-context';

export let isDirty = true;

export function invalidate() {
  isDirty = true;
}

export function setInvalidated() {
  isDirty = false;
}

export default abstract class DrawingComponent {
  abstract draw(dc: DrawingContext): void;
}
