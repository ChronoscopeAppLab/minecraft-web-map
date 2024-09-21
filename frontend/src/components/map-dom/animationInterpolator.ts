export default class AnimationInterpolator {
  static linearInterpolator(ratio: number) {
    return ratio;
  }

  static accelerateDeaccelerateInterpolator(ratio: number) {
    return (Math.sin((ratio - 0.5) * Math.PI) + 1) / 2;
  }

  static overshootInterpolator(ratio: number) {
    return (-5 / 3) * Math.pow(ratio - 4 / 5, 2) + 16 / 15;
  }

  static swanDiveInterpolator(ratio: number) {
    return -Math.pow(ratio * 2 - 1, 2) + 1;
  }

  static vibrateInterpolator(ratio: number) {
    return -Math.sin(ratio * 2 * Math.PI);
  }
}
