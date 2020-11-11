import { CollectOutputFlowUnit } from '../lib/collect-output-flow-unit';
import { XFlowUnit } from '../lib/flow-unit';

// 自定义几个flow
class TestFlowUnit1 extends XFlowUnit {
  async doWork() {
    return '1';
  }
}

class TestFlowUnit2 extends XFlowUnit {
  async doWork(data: string) {
    return data + '_2';
  }
}

class TestFlowUnit3 extends XFlowUnit {
  async doWork(data: string) {
    return '3';
  }
}

describe('测试collect-output-flow-unit', () => {
  it('第一个unit忽视input', async () => {
    const fu = new CollectOutputFlowUnit();

    fu.addUnit(new TestFlowUnit1());
    fu.addUnit(new TestFlowUnit2());
    fu.addUnit(new TestFlowUnit3());

    const result = await fu.doWork('hello');
    expect(result.length).toBe(3);
    expect(result[0]).toBe('1');
    expect(result[1]).toBe('1_2');
    expect(result[2]).toBe('3');
  });

  it('第一个unit接受input', async () => {
    const fu = new CollectOutputFlowUnit();

    fu.addUnit(new TestFlowUnit2());
    fu.addUnit(new TestFlowUnit1());
    fu.addUnit(new TestFlowUnit3());

    const result = await fu.doWork('hello');
    expect(result.length).toBe(3);
    expect(result[0]).toBe('hello_2');
    expect(result[1]).toBe('1');
    expect(result[2]).toBe('3');
  });
});
