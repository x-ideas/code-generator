export class XFlowUnit {
  _id: string;

  constructor() {
    this._id = '';
  }

  async doWork(data: any): Promise<any> {
    throw Error('需要子类完成');
  }
}
