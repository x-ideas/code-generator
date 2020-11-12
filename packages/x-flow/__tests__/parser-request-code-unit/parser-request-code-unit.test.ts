/*
 * @name:
 * description:
 *  解析swagger文档，获得请求code对应的openAPI文档
 */

import { ParseRequestCodeFlowUnit } from '../../lib/concreate-units/parse-request-code';
import OpenAPIData from './openAPI.json';

describe('测试ParseRequestCodeFlowUnit', () => {
  it('解析3610401(存在)', async () => {
    const prcfu = new ParseRequestCodeFlowUnit();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = await prcfu.doWork(['3610401', OpenAPIData]);

    expect(result.swagger).toBe('2.0');
    expect(Object.keys(result.definitions ?? {}).length).toBe(3);
    expect(result.paths['/admin/depot/apply']).toBeDefined();

    console.log('===========', result.paths);

    expect(result.paths).toStrictEqual({
      '/admin/depot/apply': {
        get: {
          tags: ['depot-apply-controller'],
          summary: '分页查找补货需求单: 3610401',
          operationId: 'pageApplyUsingGET',
          produces: ['*/*'],
          parameters: [
            {
              name: 'Authorization',
              in: 'header',
              description: '用户签名，JWT Bearer',
              required: false,
              type: 'string',
            },
            {
              name: 'applyNo',
              in: 'query',
              description: '需求单号',
              required: false,
              type: 'string',
            },
            {
              name: 'storeId',
              in: 'query',
              description: '门店id',
              required: false,
              type: 'string',
            },
            {
              name: 'status',
              in: 'query',
              description: '状态,-1=全部，1=草稿，10=待发送，20=待发货，30=待收货，40=到货中，50=已完成 ，120=未完成  200=删除',
              required: false,
              type: 'integer',
              format: 'int32',
            },
            {
              name: 'timeCreateFrom',
              in: 'query',
              description: '创建时间开始',
              required: false,
              type: 'integer',
              format: 'int64',
            },
            {
              name: 'timeCreateTo',
              in: 'query',
              description: '创建时间结束',
              required: false,
              type: 'integer',
              format: 'int64',
            },
            {
              name: 'page',
              in: 'query',
              description: '第几页(0..N)',
              required: true,
              type: 'integer',
              default: 0,
              format: 'int32',
            },
            {
              name: 'size',
              in: 'query',
              description: '每页大小',
              required: true,
              type: 'integer',
              default: 20,
              format: 'int32',
            },
            {
              name: 'sort',
              in: 'query',
              description: '排序，格式: property(,asc|desc). 默认升序. ',
              required: false,
              type: 'array',
              items: {
                type: 'string',
              },
              collectionFormat: 'multi',
            },
          ],
          responses: {
            '200': {
              description: 'OK',
              schema: {
                $ref: '#/definitions/PupuPagerDataResponse«List«补货需求单，列表用»»',
              },
            },
            '401': {
              description: 'Unauthorized',
            },
            '403': {
              description: 'Forbidden',
            },
            '404': {
              description: 'Not Found',
            },
          },
        },
      },
    });
  });

  it('解析876544(不存在)', async () => {
    const prcfu = new ParseRequestCodeFlowUnit();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(prcfu.doWork(['876544', OpenAPIData])).rejects.toBeInstanceOf(Error);
  });
});
