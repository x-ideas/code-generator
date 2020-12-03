/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GenerateServiceRequestFlowUnit } from '../lib/concreate-units/generate-service-request';
import { Response } from 'cross-fetch';

jest.mock('../lib/concreate-units/request-swagger/request-swagger-unit');

import SwaggerDoc from './assets/openAPI.json';
// @ts-ignore
import { setResponse } from '../lib/concreate-units/request-swagger/request-swagger-unit';

beforeEach(() => {
  const res = new Response(JSON.stringify(SwaggerDoc), {
    status: 200,
  });
  setResponse(res);
});

describe('测试generate-service-request', () => {
  test('code 3610412 get 数组/CommonResponse--不启用adapt', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610412',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',

      serviceName: 'DemoRequest',

      responseDataType: 'RegionInfoDemo',
    });

    expect(result).toMatchSnapshot();
  });

  test('code 3610412 get 数组/CommonResponse--interface adaptr', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610412',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',

      serviceName: 'DemoRequest',

      responseDataType: 'RegionInfoDemo',

      adaptType: 'interface',
    });

    expect(result).toMatchSnapshot();
  });

  test('code 3610412 get 数组/CommonResponse--class adaptr', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610412',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',

      serviceName: 'DemoRequest',

      responseDataType: 'RegionInfoDemo',

      adaptType: 'class',
    });

    expect(result).toMatchSnapshot();
  });

  test('code 3610401 get 数组/ ListResponse --不启用adapt', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610401',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
      serviceName: 'DemoRequest',
      responseDataType: 'RegionInfoDemo',
    });

    expect(result).toMatchSnapshot();
  });

  test('code 3610401 get 数组/ ListResponse --interface adapt', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610401',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
      serviceName: 'DemoRequest',
      responseDataType: 'RegionInfoDemo',

      adaptType: 'interface',
    });

    expect(result).toMatchSnapshot();
  });

  test('code 3610401 get 数组/ ListResponse --class adapt', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610401',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
      serviceName: 'DemoRequest',
      responseDataType: 'RegionInfoDemo',

      adaptType: 'class',
    });

    expect(result).toMatchSnapshot();
  });

  test('code 3610119 get 非数组/CommonResponse void-不启用adapt', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610119',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
      serviceName: 'DemoRequest',
      responseDataType: 'RegionInfoDemo',
    });
    expect(result).toMatchSnapshot();
  });

  test('code 3610119 get 非数组/CommonResponse void- interface adapt', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610119',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
      serviceName: 'DemoRequest',
      responseDataType: 'RegionInfoDemo',
      adaptType: 'interface',
    });
    expect(result).toMatchSnapshot();
  });

  test('code 3610119 get 非数组/CommonResponse void- class adapt', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610119',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
      serviceName: 'DemoRequest',
      responseDataType: 'RegionInfoDemo',
      adaptType: 'class',
    });
    expect(result).toMatchSnapshot();
  });

  test('code 3610404 put CommonResponse--不启用adapt', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610404',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
      serviceName: 'DemoRequest',
      responseDataType: 'RegionInfoDemo',
    });
    expect(result).toMatchSnapshot();
  });

  test('code 3610404 put CommonResponse--interface adapt', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610404',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
      serviceName: 'DemoRequest',
      responseDataType: 'RegionInfoDemo',
      adaptType: 'interface',
    });
    expect(result).toMatchSnapshot();
  });

  test('code 3610404 put CommonResponse--class adapt', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610404',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
      serviceName: 'DemoRequest',
      responseDataType: 'RegionInfoDemo',
      adaptType: 'class',
    });
    expect(result).toMatchSnapshot();
  });
});
