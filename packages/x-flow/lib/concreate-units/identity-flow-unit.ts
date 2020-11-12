import { XFlowUnit } from '../flow-unit';

export class IDentityFlowUnit extends XFlowUnit {
  async doWork(input: any): Promise<any> {
    return input;
  }
}
