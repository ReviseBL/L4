import type { Point2D } from '../core/math/geometry-types';

export interface PlayerPositionReport extends Point2D {
  reportedAtMs: number;
  source: 'companyCar';
}

export interface PositionReportConfig {
  durationMs: number;
  coworkerOffset: Point2D;
  hrOffset: Point2D;
  managerOffset: Point2D;
}

export class PositionReportSystem {
  private report: PlayerPositionReport | null = null;

  public constructor(private readonly config: PositionReportConfig) {}
  public reportPlayer(position: Point2D, nowMs: number): PlayerPositionReport {
    this.report = { ...position, reportedAtMs: nowMs, source: 'companyCar' };
    return { ...this.report };
  }
  public update(nowMs: number): boolean {
    if (this.report && nowMs - this.report.reportedAtMs >= this.config.durationMs) {
      this.report = null; return true;
    }
    return false;
  }
  public getActiveReport(nowMs: number): PlayerPositionReport | null {
    if (!this.report || nowMs - this.report.reportedAtMs >= this.config.durationMs) return null;
    return { ...this.report };
  }
  public getInvestigationTarget(kind: 'coworker' | 'hr' | 'manager', nowMs: number): Point2D | null {
    const report = this.getActiveReport(nowMs); if (!report) return null;
    const offset = kind === 'manager'
      ? this.config.managerOffset
      : kind === 'hr'
        ? this.config.hrOffset
        : this.config.coworkerOffset;
    return { x: report.x + offset.x, y: report.y + offset.y };
  }
  public clear(): void { this.report = null; }
}
