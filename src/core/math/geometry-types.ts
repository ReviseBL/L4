export interface Point2D {
  x: number;
  y: number;
}

export interface ObstacleBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  /**
   * Sight only: an observer within this distance of the box's centre sees
   * through it (a closed door you can peek through from the doorstep).
   */
  transparentWithin?: number;
}
