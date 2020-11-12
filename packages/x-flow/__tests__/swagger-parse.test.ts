import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { SwaggerParseFlowUnit } from '../lib/concreate-units/swagger-parse';
import { ParseRequestCodeFlowUnit } from '../lib/concreate-units/parse-request-code';
import OpenAPIData from './assets/openAPI.json';
import { XFlowController } from '../lib/flow-controller';
import { CollectOutputFlowUnit } from '../lib/collect-output-flow-unit';
import { SpecialOutputFlowUnit } from '../lib/concreate-units/special-output-flow-unit';

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
});
