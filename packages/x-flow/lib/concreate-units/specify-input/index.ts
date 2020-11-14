/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { XFlowUnit } from '../../flow-unit';

export class SpecifyInputFlowUnit extends XFlowUnit {
  #input: any;
  constructor(input: any) {
    super();

    this.#input = input;
  }

  async doWork(): Promise<any> {
    return this.#input;
  }
}
