import { OpenAPIV2 } from 'openapi-types';
import { CollectOutputFlowUnit } from '../lib/collect-output-flow-unit';
import { GenerateRequestParamsJsonSchemaFlowUnit } from '../lib/concreate-units/generate-request-params-json-schema';
import { ParseRequestCodeFlowUnit } from '../lib/concreate-units/parse-request-code';
import { SpecialOutputFlowUnit } from '../lib/concreate-units/special-output-flow-unit';
import { SwaggerParseFlowUnit } from '../lib/concreate-units/swagger-parse';
import { XFlowController } from '../lib/flow-controller';

import OpenAPIData from './assets/openAPI.json';

describe('测试GenerateRequestParamsJsonSchemaFlowUnit', () => {
  test('解析3610401', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610401');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();

    const frpUnit = new GenerateRequestParamsJsonSchemaFlowUnit();

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(frpUnit);

    const result: OpenAPIV2.Document = await fc.run();
    // console.log(result);
  });
});
