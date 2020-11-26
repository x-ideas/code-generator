import { XFlowUnit } from './flow-unit';

export class WrapDataFlowUnit extends XFlowUnit {
  #wrapKey: string;
  constructor(wrapKey: string) {
    super();

    this.#wrapKey = wrapKey;
  }

  async doWork(data: any): Promise<Record<string, any>> {
    return {
      [this.#wrapKey]: data,
    };
  }
}
