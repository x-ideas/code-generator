import { OpenAPIV2 } from 'openapi-types';
import { SwaggerParseFlowUnit } from '../lib/concreate-units/swagger-parse';
import { ParseRequestCodeFlowUnit } from '../lib/concreate-units/parse-request-code';
import OpenAPIData from './assets/openAPI.json';
import { XFlowController } from '../lib/flow-controller';
import { CollectOutputFlowUnit } from '../lib/collect-output-flow-unit';
import { SpecialOutputFlowUnit } from '../lib/concreate-units/specify-output';
import { ConvertOpenAPIToJsonSchemeFlowUnit } from '../lib/concreate-units/open-api-to-json-schema/convert-openapi-to-json-schema-unit';
import { JSONSchema4 } from 'json-schema';

describe('测试 open api to json schema', () => {
  it('解析3610401', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610401');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();

    const openAPIToJsonSchemaUnit = new ConvertOpenAPIToJsonSchemeFlowUnit();

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(openAPIToJsonSchemaUnit);

    const result: JSONSchema4 = await fc.run();
    expect(result).toMatchSnapshot();
  });
});
