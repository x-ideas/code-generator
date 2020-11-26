/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import { MergeOutputFlowUnit } from '../lib/merge-output-flow-unit';

import Swagger3601401Data from './assets/3610401.json';
import { WrapDataFlowUnit } from '../lib/wrap-data-flow-unit';

describe('测试InterfaceGenerateFlowUnit-response', () => {
  test('3601401-data', async () => {
    const backendInterfaceGenerate = new InterfaceGenerateFlowUnit({ nicePropertyName: false });
    const result = await backendInterfaceGenerate.doWork({
      // @ts-ignore
      jsonSchema: Swagger3601401Data,
      topName: 'Demo',
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('不修改property', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610401');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();
    const frpUnit = new GenerateResponseDataSchemaFlowUnit();

    const wrapUnit = new WrapDataFlowUnit('jsonSchema');
    const moUnit = new MergeOutputFlowUnit({
      topName: 'Demo',
    });
    const backendInterfaceGenerate = new InterfaceGenerateFlowUnit({ nicePropertyName: false });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(frpUnit);
    fc.addUnit(wrapUnit);
    fc.addUnit(moUnit);
    fc.addUnit(backendInterfaceGenerate);

    const result: string[] = await fc.run();
    expect(result.length).toBeGreaterThan(0);
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

    const wrapUnit = new WrapDataFlowUnit('jsonSchema');
    const moUnit = new MergeOutputFlowUnit({
      topName: 'Demo',
    });
    const backendInterfaceGenerate = new InterfaceGenerateFlowUnit({ nicePropertyName: false });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(frpUnit);
    fc.addUnit(wrapUnit);
    fc.addUnit(moUnit);
    fc.addUnit(backendInterfaceGenerate);

    const result: string[] = await fc.run();
    expect(result.length).toBeGreaterThan(0);
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

    const wrapUnit = new WrapDataFlowUnit('jsonSchema');
    const moUnit = new MergeOutputFlowUnit({
      topName: 'Demo',
    });
    const backendInterfaceGenerate = new InterfaceGenerateFlowUnit({ nicePropertyName: false });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(frpUnit);
    fc.addUnit(wrapUnit);
    fc.addUnit(moUnit);
    fc.addUnit(backendInterfaceGenerate);

    const result: string[] = await fc.run();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('测试InterfaceGenerateFlowUnit--请求参数', () => {
  test('只有header的请求', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610115');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();

    const moUnit = new MergeOutputFlowUnit({
      topName: 'Demo',
    });

    const frpUnit = new GenerateRequestParamsJsonSchemaFlowUnit();
    const binterUnit = new InterfaceGenerateFlowUnit({ nicePropertyName: true });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);

    fc.addUnit(moUnit);
    fc.addUnit(frpUnit);
    // fc.addUnit(binterUnit);

    const requestParamsSchema = await fc.run();

    const pathLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.path, topName: 'Demo' });
    expect(pathLines.length).toBe(0);

    const queryLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.query, topName: 'Demo' });
    expect(queryLines.length).toBe(0);

    const bodyLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.body, topName: 'Demo' });
    expect(bodyLines.length).toBe(0);
  });

  test('有header+path-id的请求', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610111');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();

    const moUnit = new MergeOutputFlowUnit({
      topName: 'Demo',
    });

    const frpUnit = new GenerateRequestParamsJsonSchemaFlowUnit();
    const binterUnit = new InterfaceGenerateFlowUnit({ nicePropertyName: true });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);

    fc.addUnit(moUnit);
    fc.addUnit(frpUnit);
    // fc.addUnit(binterUnit);

    const requestParamsSchema = await fc.run();

    const pathLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.path, topName: 'Demo' });
    expect(pathLines.length).not.toBe(0);

    const queryLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.query, topName: 'Demo' });
    expect(queryLines.length).toBe(0);

    const bodyLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.body, topName: 'Demo' });
    expect(bodyLines.length).toBe(0);
  });

  test('有header+path-非id的请求', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610412');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();

    const moUnit = new MergeOutputFlowUnit({
      topName: 'Demo',
    });

    const frpUnit = new GenerateRequestParamsJsonSchemaFlowUnit();
    const binterUnit = new InterfaceGenerateFlowUnit({ nicePropertyName: true });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);

    fc.addUnit(moUnit);
    fc.addUnit(frpUnit);

    const requestParamsSchema = await fc.run();
    const pathLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.path, topName: 'Demo' });
    expect(pathLines.length).not.toBe(0);

    const queryLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.query, topName: 'Demo' });
    expect(queryLines.length).toBe(0);

    const bodyLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.body, topName: 'Demo' });
    expect(bodyLines.length).toBe(0);
  });

  test('有header + query的请求', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610702');
    const outputOpenAPIUnit = new SpecialOutputFlowUnit(OpenAPIData);
    collectOutputUnit.addUnit(outputCodeUnit);
    collectOutputUnit.addUnit(outputOpenAPIUnit);

    const codeParseUnit = new ParseRequestCodeFlowUnit();
    const swaggerParseUnit = new SwaggerParseFlowUnit();

    const moUnit = new MergeOutputFlowUnit({
      topName: 'Demo',
    });

    const frpUnit = new GenerateRequestParamsJsonSchemaFlowUnit();
    const binterUnit = new InterfaceGenerateFlowUnit({ nicePropertyName: true });

    fc.addUnit(collectOutputUnit);
    fc.addUnit(codeParseUnit);
    fc.addUnit(swaggerParseUnit);
    fc.addUnit(moUnit);
    fc.addUnit(frpUnit);

    const requestParamsSchema = await fc.run();
    const pathLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.path, topName: 'Demo' });
    expect(pathLines.length).toBe(0);

    const queryLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.query, topName: 'Demo' });
    expect(queryLines.length).not.toBe(0);

    const bodyLines = await binterUnit.doWork({ jsonSchema: requestParamsSchema.body, topName: 'Demo' });
    expect(bodyLines.length).toBe(0);
  });
});
