import { OpenAPIV2 } from 'openapi-types';
import { CollectOutputFlowUnit } from '../lib/collect-output-flow-unit';
import { ParseRequestCodeFlowUnit } from '../lib/concreate-units/parse-request-code';
import { SpecialOutputFlowUnit } from '../lib/concreate-units/specify-output';
import { SwaggerParseFlowUnit } from '../lib/concreate-units/swagger-parse';
import { XFlowController } from '../lib/flow-controller';

import OpenAPIData from './assets/openAPI.json';
import { GenerateResponseDataSchemaFlowUnit } from '../lib/concreate-units/generate-response-data-schema';

describe('测试GenerateRequestParamsJsonSchemaFlowUnit', () => {
  test('简单', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610115');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();

    const frpUnit = new GenerateResponseDataSchemaFlowUnit();

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(frpUnit);

    const result: OpenAPIV2.Document = await fc.run();
  });

  test('复杂-3610116', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610116');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();

    const frpUnit = new GenerateResponseDataSchemaFlowUnit();

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(frpUnit);

    const result: OpenAPIV2.Document = await fc.run();
    console.log(result);
  });

  // test('只包含body+header', async () => {
  //   const fc = new XFlowController();

  //   const collectOutputUnit = new CollectOutputFlowUnit();

  //   const outputCodeUnit = new SpecialOutputFlowUnit('3610116');
  //   const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
  //   collectOutputUnit.addUnit(outputCodeUnit);
  //   collectOutputUnit.addUnit(outputOpenAPIUnit);

  //   const codeParseUnit = new ParseRequestCodeFlowUnit();
  //   const swaggerParseUnit = new SwaggerParseFlowUnit();

  //   const frpUnit = new GenerateRequestParamsJsonSchemaFlowUnit();

  //   fc.addUnit(collectOutputUnit);
  //   fc.addUnit(codeParseUnit);
  //   fc.addUnit(swaggerParseUnit);
  //   fc.addUnit(frpUnit);

  //   const result: OpenAPIV2.Document = await fc.run();
  //   // console.log(result);
  // });

  // test('不包含body和path', async () => {
  //   const fc = new XFlowController();

  //   const collectOutputUnit = new CollectOutputFlowUnit();

  //   const outputCodeUnit = new SpecialOutputFlowUnit('3610401');
  //   const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
  //   collectOutputUnit.addUnit(outputCodeUnit);
  //   collectOutputUnit.addUnit(outputOpenAPIUnit);

  //   const codeParseUnit = new ParseRequestCodeFlowUnit();
  //   const swaggerParseUnit = new SwaggerParseFlowUnit();

  //   const frpUnit = new GenerateRequestParamsJsonSchemaFlowUnit();

  //   fc.addUnit(collectOutputUnit);
  //   fc.addUnit(codeParseUnit);
  //   fc.addUnit(swaggerParseUnit);
  //   fc.addUnit(frpUnit);

  //   const result: OpenAPIV2.Document = await fc.run();
  // });
});
