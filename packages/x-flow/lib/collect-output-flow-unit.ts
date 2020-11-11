/*
 * @name:
 * description:
 *  用于收集所有子flow unit的output的数据，统一传递给下一个flow unit
 */

import { XGroupedFlowUnit } from './grouped-flow-unit';

export class CollectOutputFlowUnit extends XGroupedFlowUnit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  async doWork(data: any): Promise<any[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = [];

    let nextData = data;
    for (const unit of this._units) {
      nextData = await unit.doWork(nextData);
      result.push(nextData);
    }

    return result;
  }
}
