import { GenerateInterfaceAdaptor } from '../lib/concreate-units/generate-interface-adaptor';

describe('测试 genereateInterfaceAdaptor', () => {
  test('属性中未包含其他对象', async () => {
    const gUnit = new GenerateInterfaceAdaptor();

    const from = `export interface IFgetDemoRequestQueryParamsObject {
          /**
           * 城市编码
           */
          areaZip?: IBgetDemoRequestQueryParamsObjectddd;
      }`;

    const result = await gUnit.doWork({
      fromType: 'IFgetDemoRequestQueryParamsObject',
      from: from,

      toType: 'IBgetDemoRequestQueryParamsObject',

      isConvertedFromFront: true,
    });

    console.log(result);
  });
  test('属性中未包含其他对象', async () => {
    const gUnit = new GenerateInterfaceAdaptor();

    const from = `export interface IBgetDemoRequestQueryParamsObject {
          /**
           * 城市编码
           */
          area_zip?: number;
      }`;

    const result = await gUnit.doWork({
      fromType: 'IBgetDemoRequestQueryParamsObject',
      from: from,

      toType: 'IFgetDemoRequestQueryParamsObject',

      isConvertedFromFront: false,
    });

    console.log(result);
  });

  test('属性中包含其他对象(非数组)', async () => {
    const gUnit = new GenerateInterfaceAdaptor();

    const from = `            
      export interface GetDemoRequestBodyParamsObject {
          /**
           * list
           */
          list?: List;
      }
      
      /**
       * 补货需求单补货数
       */
      export interface List {
          /**
           * 商品id
           */
          productID?: string;
          /**
           * 补货数
           */
          replenishCount?: number;
      }`;

    const result = await gUnit.doWork({
      fromType: 'GetDemoRequestBodyParamsObject',
      from: from,

      toType: 'IBGetDemoRequestBodyParamsObject',

      isConvertedFromFront: true,
    });

    console.log(result);
  });

  test('属性中包含其他对象(数组)', async () => {
    const gUnit = new GenerateInterfaceAdaptor();

    const from = `            
      export interface GetDemoRequestBodyParamsObject {
          /**
           * list
           */
          list?: List[];
      }
      
      /**
       * 补货需求单补货数
       */
      export interface List {
          /**
           * 商品id
           */
          productID?: string;
          /**
           * 补货数
           */
          replenishCount?: number;
      }`;

    const result = await gUnit.doWork({
      fromType: 'GetDemoRequestBodyParamsObject',
      from: from,

      toType: 'IBGetDemoRequestBodyParamsObject',

      isConvertedFromFront: true,
    });

    console.log(result);
  });
});
