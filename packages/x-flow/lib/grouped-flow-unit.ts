import { XFlowUnit } from './flow-unit';

export class XGroupedFlowUnit extends XFlowUnit {
  _units: XFlowUnit[];

  addUnit(unit: XFlowUnit): void {
    this._units.push(unit);
  }

  constructor() {
    super();

    this._units = [];
  }
}
