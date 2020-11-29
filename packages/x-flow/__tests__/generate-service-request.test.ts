/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GenerateServiceRequestFlowUnit } from '../lib/concreate-units/generate-service-request';
import { Response } from 'cross-fetch';

jest.mock('../lib/concreate-units/request-swagger/request-swagger-unit');

import SwaggerDoc from './assets/openAPI.json';
// @ts-ignore
import { setResponse } from '../lib/concreate-units/request-swagger/request-swagger-unit';

import fs from 'fs';

beforeEach(() => {
  const res = new Response(JSON.stringify(SwaggerDoc), {
    status: 200,
  });
  setResponse(res);
});

describe('测试generate-service-request', () => {
  test('code 3610412 get 数组/CommonResponse', async () => {
    const unit = new GenerateServiceRequestFlowUnit();
    const result = await unit.doWork({
      code: '3610412',
      swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',

      serviceName: 'DemoRequest',

      responseDataType: 'RegionInfoDemo',

      toClass: false,
    });

    // fs.writeFileSync('./demo.ts', result);
    expect(1).toBe(2);

    // console.log(result);
  });
  // test('code 3610401 get 数组/ ListResponse ', async () => {
  //   const unit = new GenerateServiceRequestFlowUnit();
  //   const result = await unit.doWork({
  //     requestUrl: 'http://ja.api.dev.pupuvip.com',
  //     code: '3610401',
  //     swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
  //     className: 'Demo',
  //     serviceName: 'getDemoRequest',
  //     responseDataType: 'RegionInfoDemo',
  //   });
  //   console.log(result);
  // });
  // test('code 3610119 get 非数组/CommonResponse void', async () => {
  //   const unit = new GenerateServiceRequestFlowUnit();
  //   const result = await unit.doWork({
  //     requestUrl: 'http://ja.api.dev.pupuvip.com',
  //     code: '3610119',
  //     swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
  //     className: 'Demo',
  //     serviceName: 'getDemoRequest',
  //     responseDataType: 'RegionInfoDemo',
  //   });
  //   console.log(result);
  // });
  // test('code 3610404 put CommonResponse', async () => {
  //   const unit = new GenerateServiceRequestFlowUnit();
  //   const result = await unit.doWork({
  //     requestUrl: 'http://ja.api.dev.pupuvip.com',
  //     code: '3610404',
  //     swaggerSite: 'http://10.99.244.137:7076/v2/api-docs',
  //     className: 'Demo',
  //     serviceName: 'getDemoRequest',
  //     responseDataType: 'RegionInfoDemo',
  //   });
  //   console.log(result);
  // });
});
