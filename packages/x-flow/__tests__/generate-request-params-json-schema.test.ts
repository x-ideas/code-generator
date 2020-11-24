import { JSONSchema4 } from 'json-schema';
import { CollectOutputFlowUnit } from '../lib/collect-output-flow-unit';
import { GenerateRequestParamsJsonSchemaFlowUnit } from '../lib/concreate-units/generate-request-params-json-schema';
import { ParseRequestCodeFlowUnit } from '../lib/concreate-units/parse-request-code';
import { SpecialOutputFlowUnit } from '../lib/concreate-units/specify-output';
import { SwaggerParseFlowUnit } from '../lib/concreate-units/swagger-parse';
import { XFlowController } from '../lib/flow-controller';

import OpenAPIData from './assets/openAPI.json';

describe('测试GenerateRequestParamsJsonSchemaFlowUnit', () => {
  test('只包含header', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610115');
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

    const result = await fc.run();
    expect(result.path).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '定时任务-需求单确认: 3610115',
      properties: {},
      required: [],
    });

    expect(result.query).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '定时任务-需求单确认: 3610115',
      properties: {},
      required: [],
    });

    expect(result.body).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '定时任务-需求单确认: 3610115',
      properties: {},
      required: [],
    });
  });

  test('只包含path+header--3610111', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610111');
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

    const result: JSONSchema4 = await fc.run();

    console.log(result);

    expect(result.body).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '取消补货订单: 3610111',
      properties: {},
      required: [],
    });
    expect(result.query).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '取消补货订单: 3610111',
      properties: {},
      required: [],
    });
    expect(result.path).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '取消补货订单: 3610111',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          description: 'id',
        },
      },
    });
  });

  test('只包含path+header--3610412', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610412');
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

    const result: JSONSchema4 = await fc.run();

    expect(result.body).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '查找需求单明细修改日志: 3610412',
      properties: {},
      required: [],
    });
    expect(result.query).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '查找需求单明细修改日志: 3610412',
      properties: {},
      required: [],
    });
    expect(result.path).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '查找需求单明细修改日志: 3610412',
      required: ['detail_id'],
      properties: {
        detail_id: {
          type: 'string',
          description: '门店补货需求单明细ID',
        },
      },
    });
  });

  test('包含header+body-3610116ref引用', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610116');
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

    const result: JSONSchema4 = await fc.run();

    expect(result.query).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '新增补货订单: 3610116',
      properties: {},
      required: [],
    });
    expect(result.path).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '新增补货订单: 3610116',
      required: [],
      properties: {},
    });

    expect(result.body).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '新增补货订单: 3610116',
      required: [],
      properties: {
        saveRo: {
          type: 'object',
          description: 'saveRo',
          properties: {
            batch_type: {
              type: 'integer',
              description: '商品批次类型，0正常商品/10优惠品',
            },
            dc_id: {
              type: 'string',
              description: '总仓id',
            },
            remark: {
              type: 'string',
              description: '备注',
            },
            replenish_store_list: {
              type: 'array',
              description: '门店补货计划',
              items: {
                type: 'object',
                description: '门店补货商品',
                properties: {
                  apply_detail_id: {
                    type: 'string',
                    description: '需求明细id',
                  },
                  day_arrive_expect: {
                    type: 'integer',
                    description: '到货周期/预计到货天数',
                  },
                  day_arrive_sale_sum: {
                    type: 'integer',
                    description: '到货期内的销量',
                  },
                  day_sale: {
                    type: 'integer',
                    description: '售卖周期/售卖天数',
                  },
                  is_query_cache: {
                    type: 'boolean',
                    description: '是否缓存数据',
                  },
                  num_on_the_way: {
                    type: 'integer',

                    description: '在途数',
                  },
                  num_on_the_way_old: {
                    type: 'integer',
                    description: '在途数',
                  },
                  period_arrive: {
                    type: 'integer',
                    description: '到货时间段',
                  },
                  product_count_correct: {
                    type: 'integer',
                    description: '校正补货数',
                  },
                  product_id: {
                    type: 'string',
                    description: '商品id',
                  },
                  replenish_coefficient: {
                    type: 'number',

                    description: '补货系数',
                  },
                  replenish_count: {
                    type: 'integer',
                    description: '补货数',
                  },
                  replenish_count_adjust: {
                    type: 'integer',
                    description: '调整后补货数',
                  },
                  replenish_count_correct: {
                    type: 'integer',
                    description: '校正补货数',
                  },
                  replenish_count_handled: {
                    type: 'integer',
                    description: '已操作数',
                  },
                  replenish_count_suggest: {
                    type: 'integer',
                    description: '建议补货数',
                  },
                  sale_num_day_safe: {
                    type: 'number',

                    description: '每天预计销量/安全销量',
                  },
                  sale_num_sum: {
                    type: 'integer',
                    description: '总预计销量/总安全销量',
                  },
                  sale_recently_week: {
                    type: 'integer',
                    description: '近7天销量',
                  },
                  sale_yesterday: {
                    type: 'integer',
                    description: '昨日销量',
                  },
                  stock_quantity: {
                    type: 'integer',
                    description: '当前库存',
                  },
                  stock_quantity_old: {
                    type: 'integer',
                    description: '当时库存',
                  },
                  store_abbr_name: {
                    type: 'string',
                    description: '门店简称',
                  },
                  store_code: {
                    type: 'integer',
                    description: '门店code',
                  },
                  store_id: {
                    type: 'string',
                    description: '门店id',
                  },
                  store_name: {
                    type: 'string',
                    description: '门店名称',
                  },
                  store_product_id: {
                    type: 'string',
                    description: '网点商品id',
                  },
                },
              },
            },
            status: {
              type: 'integer',
              description: '状态，0=草稿，10=确认/待集货',
            },
            time_plan_arrival: {
              type: 'integer',
              description: '计划送达时间',
            },
          },
        },
      },
    });
  });

  test('path_body3610404', async () => {
    const fc = new XFlowController();

    const collectOutputUnit = new CollectOutputFlowUnit();

    const outputCodeUnit = new SpecialOutputFlowUnit('3610404');
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

    const result = await fc.run();
    expect(result.path).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '确认需求单，变更补货数: 3610404',
      properties: {
        id: {
          description: 'id',
          type: 'string',
        },
      },
      required: ['id'],
    });

    expect(result.query).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '确认需求单，变更补货数: 3610404',
      properties: {},
      required: [],
    });

    expect(result.body).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '确认需求单，变更补货数: 3610404',
      properties: {
        list: {
          description: 'list',
          type: 'array',
          items: {
            type: 'object',
            description: '补货需求单补货数',
            properties: {
              product_id: {
                type: 'string',
                description: '商品id',
              },
              replenish_count: {
                type: 'integer',
                description: '补货数',
              },
            },
          },
        },
      },
      // NOTE: 此时list是必须的，应该出现在requeired中
      required: [],
    });
  });

  test('不包含body和path', async () => {
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

    const result = await fc.run();

    expect(result.path).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '分页查找补货需求单: 3610401',
      properties: {},
      required: [],
    });
    expect(result.body).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '分页查找补货需求单: 3610401',
      required: [],
      properties: {},
    });
    expect(result.query).toEqual({
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: '分页查找补货需求单: 3610401',
      properties: {
        applyNo: {
          type: 'string',
          description: '需求单号',
        },
        storeId: {
          type: 'string',
          description: '门店id',
        },
        status: {
          type: 'integer',
          description: '状态,-1=全部，1=草稿，10=待发送，20=待发货，30=待收货，40=到货中，50=已完成 ，120=未完成  200=删除',
        },
        timeCreateFrom: {
          type: 'integer',
          description: '创建时间开始',
        },
        timeCreateTo: {
          description: '创建时间结束',
          type: 'integer',
        },
        page: {
          description: '第几页(0..N)',
          type: 'integer',
        },
        size: {
          type: 'integer',
          description: '每页大小',
        },
        sort: {
          type: 'array',
          description: '排序，格式: property(,asc|desc). 默认升序. ',
          items: {
            type: 'string',
            description: 'item-暂无',
          },
        },
      },
      required: ['page', 'size'],
    });
  });
});
