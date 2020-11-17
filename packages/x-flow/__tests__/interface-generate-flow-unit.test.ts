import { OpenAPIV2 } from 'openapi-types';
import { CollectOutputFlowUnit } from '../lib/collect-output-flow-unit';
import { InterfaceGenerateFlowUnit } from '../lib/concreate-units/generate-interface';
import { ParseRequestCodeFlowUnit } from '../lib/concreate-units/parse-request-code';
import { SpecialOutputFlowUnit } from '../lib/concreate-units/specify-output';
import { SwaggerParseFlowUnit } from '../lib/concreate-units/swagger-parse';
import { XFlowController } from '../lib/flow-controller';

import OpenAPIData from './assets/openAPI.json';
import { GenerateRequestParamsJsonSchemaFlowUnit } from '../lib/concreate-units/generate-request-params-json-schema';
import { GenerateResponseDataSchemaFlowUnit } from '../lib/concreate-units/generate-response-data-schema';

describe('测试InterfaceGenerateFlowUnit', () => {
  it('不修改property', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610401');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();
    const frpUnit = new GenerateRequestParamsJsonSchemaFlowUnit();

    const backendInterfaceGenerate = new InterfaceGenerateFlowUnit({ nicePropertyName: false });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(frpUnit);
    fc.addUnit(backendInterfaceGenerate);

    const result: OpenAPIV2.Document = await fc.run();
    // console.log(result);
  });

  test('3610401的响应-包含数组', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610401');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();
    const frpUnit = new GenerateResponseDataSchemaFlowUnit();

    const backendInterfaceGenerate = new InterfaceGenerateFlowUnit({ nicePropertyName: false });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(frpUnit);
    fc.addUnit(backendInterfaceGenerate);

    const result: OpenAPIV2.Document = await fc.run();
    // console.log(result);
  });

  test('3610116的响应-循环引用', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610116');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();
    const frpUnit = new GenerateResponseDataSchemaFlowUnit();

    const backendInterfaceGenerate = new InterfaceGenerateFlowUnit({ nicePropertyName: false });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(frpUnit);
    fc.addUnit(backendInterfaceGenerate);

    const result: OpenAPIV2.Document = await fc.run();
    // console.log(result);
  });
});
