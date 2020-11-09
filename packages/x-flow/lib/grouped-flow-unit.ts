import { XFlowUnit } from './flow-unit';

export class XGroupedFlowUnit extends XFlowUnit {
  _units: XFlowUnit[];

  constructor() {
    super();

    this._units = [];
  }
}
