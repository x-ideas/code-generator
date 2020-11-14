import { OpenAPIV2 } from 'openapi-types';
import { JSONSchema4 } from 'json-schema';
import { CollectOutputFlowUnit } from '../lib/collect-output-flow-unit';
import { InterfaceGenerateFlowUnit } from '../lib/concreate-units/generate-interface';
import { ConvertOpenAPIToJsonSchemeFlowUnit } from '../lib/concreate-units/open-api-to-json-schema/convert-openapi-to-json-schema-unit';
import { ParseRequestCodeFlowUnit } from '../lib/concreate-units/parse-request-code';
import { SpecialOutputFlowUnit } from '../lib/concreate-units/special-output-flow-unit';
import { SwaggerParseFlowUnit } from '../lib/concreate-units/swagger-parse';
import { XFlowController } from '../lib/flow-controller';

import OpenAPIData from './assets/openAPI.json';
import { SwaggerToOpenApiFlowUnit } from '../lib/concreate-units/swagger-to-openapi';
import { GenerateRequestParamsJsonSchemaFlowUnit } from '../lib/concreate-units/generate-request-params-json-schema';

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

    const openAPIToJsonSchemaUnit = new ConvertOpenAPIToJsonSchemeFlowUnit();

    const backendInterfaceGenerate = new InterfaceGenerateFlowUnit({ nicePropertyName: false });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(frpUnit);
    // fc.addUnit(openAPIToJsonSchemaUnit);
    fc.addUnit(backendInterfaceGenerate);

    const result: OpenAPIV2.Document = await fc.run();
    console.log(result);

    // const jsonSchemas = Object.values(result.definitions ?? {});

    // const dd = Object.values(result.paths);
    // console.log('=====', dd[0].get);

    // const toOpenApiUnit = new SwaggerToOpenApiFlowUnit();
    // const params = await toOpenApiUnit.doWork(result);
    // console.log('+++++++', params);

    // const backInterface = await backendInterfaceGenerate.doWork(dd[0].get);
    // // console.log(jsonSchemas[0]);
    // console.log(backInterface);
  });
});
