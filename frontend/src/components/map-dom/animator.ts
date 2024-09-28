import AnimationInterpolator from './animation-interpolator';

export default class Animator {
  duration: number;
  callback: (ratio: number) => void;
  finished: boolean;
  interpolator: any;
  animationFrameId: number;
  delay: number;
  reverse: boolean;
  finishCallback: any;
  startTime: number = 0;

  constructor(duration: number, callback: (ratio: number) => void) {
    this.duration = duration;
    this.callback = callback;
    this.finished = false;
    this.interpolator = AnimationInterpolator.linearInterpolator;
    this.animationFrameId = -1;
    this.delay = 0;
    this.reverse = false;
  }

  setDelay(delay: number) {
    this.delay = delay;

    return this;
  }

  setAnimationInterpolator(interpolator: (ratio: number) => number) {
    this.interpolator = interpolator;

    return this;
  }

  doFrame() {
    const now = Date.now();
    if (this.finished || now - this.startTime >= this.duration + this.delay) {
      this.callback(this.reverse ? 0.0 : 1.0);
      if (this.finishCallback) {
        this.finishCallback();
      }

      return;
    }

    if (now - this.startTime >= this.delay) {
      if (this.reverse) {
        this.callback(this.interpolator(1 - (now - this.startTime - this.delay) / this.duration));
      } else {
        this.callback(this.interpolator((now - this.startTime - this.delay) / this.duration));
      }
    }

    this.animationFrameId = requestAnimationFrame(this.doFrame.bind(this));
  }

  start() {
    this.startTime = Date.now();
    this.animationFrameId = requestAnimationFrame(this.doFrame.bind(this));
  }

  finish() {
    this.finished = true;
  }

  cancel() {
    cancelAnimationFrame(this.animationFrameId);
  }

  withEndAction(callback: () => void) {
    this.finishCallback = callback;
    return this;
  }

  reversed() {
    this.reverse = true;

    return this;
  }
}
