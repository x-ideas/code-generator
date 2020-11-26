import { XFlowUnit } from './flow-unit';

export class MergeOutputFlowUnit extends XFlowUnit {
  output: Record<string, unknown>;

  constructor(output: Record<string, unknown>) {
    super();

    this.output = output;
  }

  async doWork(data: any): Promise<Record<string, unknown>> {
    return {
      ...this.output,
      ...data,
    };
  }
}
