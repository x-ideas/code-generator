import { XFlowUnit } from './flow-unit';

type FuncType = (...args: unknown[]) => unknown;

function compose(funcs: FuncType[]): FuncType {
  return funcs.reduce((accum, current) => {
    return async function (data: unknown) {
      const nextData: any = await accum(data);
      return current(nextData);
    };
  });
}

export class XFlowController {
  private _units: XFlowUnit[];

  constructor() {
    this._units = [];
  }

  run(): void {
    const data = {};

    const final = compose(this._units.map(unit => unit.doWork));

    final(data);
  }
}
