/* eslint-disable @typescript-eslint/ban-ts-comment */

jest.mock('../lib/concreate-units/request-swagger/request-swagger-unit');

import { Response } from 'cross-fetch';
import { OpenAPIV2 } from 'openapi-types';
// NOTE: 这里的setResponse怎么办，是mock文件提供的
// @ts-ignore
import { RequestSwaggerFlowUnit, setResponse } from '../lib/concreate-units/request-swagger/request-swagger-unit';

describe('测试swagger request unit', () => {
  it('正常获取swagger', async () => {
    // 设置一个返回值
    const openAPI: OpenAPIV2.Document = {
      swagger: '2.0',
      info: {
        title: 'swagger doc',
        version: '1.0',
      },
      paths: [],
    };
    const res = new Response(JSON.stringify(openAPI), {
      status: 201,
    });
    setResponse(res);

    expect.assertions(1);

    const unit = new RequestSwaggerFlowUnit();
    await expect(unit.doWork('http://10.99.244.137:7076/v2/api-docs')).resolves.toStrictEqual({
      swagger: '2.0',
      info: {
        title: 'swagger doc',
        version: '1.0',
      },
      paths: [],
    });
  });

  it('错误的code', async () => {
    // 设置一个返回值
    const openAPI: OpenAPIV2.Document = {
      swagger: '2.0',
      info: {
        title: 'swagger doc',
        version: '1.0',
      },
      paths: [],
    };
    const res = new Response(JSON.stringify(openAPI), {
      status: 400,
    });
    setResponse(res);

    expect.assertions(1);

    const unit = new RequestSwaggerFlowUnit();
    await expect(unit.doWork('http://10.99.244.137:7076/v2/api-docs')).rejects.toBeInstanceOf(Error);
  });
});
