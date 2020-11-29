import { GenerateToClassAdaptorFlowUnit } from '../lib/concreate-units/generate-to-class-adaptor';

describe('测试generate-to-class-adaptor', () => {
  test('测试1', async () => {
    const unit = new GenerateToClassAdaptorFlowUnit();

    const result = await unit.doWork({ className: 'Demo', isArray: true });

    console.log(result);
  });
});
