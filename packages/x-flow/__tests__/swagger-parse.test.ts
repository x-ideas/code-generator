/* eslint-disable @typescript-eslint/ban-ts-comment */
import { OpenAPIV2 } from 'openapi-types';
import { SwaggerParseFlowUnit } from '../lib/concreate-units/swagger-parse';
import { ParseRequestCodeFlowUnit } from '../lib/concreate-units/parse-request-code';
import OpenAPIData from './assets/openAPI.json';
import { XFlowController } from '../lib/flow-controller';
import { CollectOutputFlowUnit } from '../lib/collect-output-flow-unit';
import { SpecialOutputFlowUnit } from '../lib/concreate-units/specify-output';

import Demo3610412Data from './assets/3610412.json';

describe('测试swagger-parse', () => {
  it('解析3610401 code对应的openAPI', async () => {
    expect.assertions(1);

    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610401');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);

    const result: OpenAPIV2.Document = await fc.run();
    expect(result.paths).toHaveProperty('/admin/depot/apply');
  });

  it('解析3610412 code对应的openAPI', async () => {
    expect.assertions(1);

    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610412');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);

    const result: OpenAPIV2.Document = await fc.run();

    expect(result.paths).toHaveProperty('/admin/depot/apply/logs/{detail_id}');
  });

  test('3610412', async () => {
    expect.assertions(1);
    const unit = new SwaggerParseFlowUnit();
    // @ts-ignore
    const result = await unit.doWork(Demo3610412Data);

    expect(result).toBeDefined();
  });
});
