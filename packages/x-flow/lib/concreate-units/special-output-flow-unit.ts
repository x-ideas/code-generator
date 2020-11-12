import { XFlowUnit } from '../flow-unit';

/**
 * 指定输出的flow unit
 * @export
 * @class SpecialOutputFlowUnit
 * @extends {XFlowUnit}
 */
export class SpecialOutputFlowUnit extends XFlowUnit {
  private _data: any;

  constructor(data: any) {
    super();
    this.setOutputData(data);
  }

  setOutputData(data: any): void {
    this._data = data;
  }

  async doWork(): Promise<any> {
    return this._data;
  }
}
