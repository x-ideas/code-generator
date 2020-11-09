export class XFlowUnit {
  async doWork(data: any): Promise<any> {
    throw Error('需要子类完成');
  }
}
