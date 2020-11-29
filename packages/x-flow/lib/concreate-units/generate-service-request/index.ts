/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * @name:
 * description:
 *  生成service的FlowUnit
 */

import assert from 'assert';
import lodash from 'lodash';
import * as babelParser from '@babel/parser';
import prettier from 'prettier';
import jscodeshift from 'jscodeshift';
import { JSONSchema4 } from 'json-schema';
import { XFlowUnit } from '../../flow-unit';
import { GenerateRequestParamsJsonSchemaFlowUnit } from '../generate-request-params-json-schema';
import { GenerateResponseDataSchemaFlowUnit } from '../generate-response-data-schema';
import { RequestSwaggerFlowUnit } from '../request-swagger/request-swagger-unit';
import { SwaggerParseFlowUnit } from '../swagger-parse';
import { ParseRequestCodeFlowUnit } from './../parse-request-code/parser-request-code-unit';
import { InterfaceGenerateFlowUnit } from '../generate-interface';
import { OpenAPIV2 } from 'openapi-types';
import { GenerateClassFlowUnit } from '../generate-class';
import { GenerateInterfaceAdaptor } from '../generate-interface-adaptor';
import { GenerateToClassAdaptorFlowUnit } from '../generate-to-class-adaptor';

interface IGenerateServiceRequestFlowUnitParams {
  /**
   * 请求的code
   * @example 3610412
   */
  code: string;
  /**
   * 用于解析swagger文档的链接地址
   * @example 'http://10.99.244.137:7076/v2/api-docs',
   */
  swaggerSite: string;
  /**
   * 类名
   */
  // className: string;

  /**
   * 请求的地址（不包括路径）
   * @example
   * http://ja.api.dev.pupuvip.com
   */
  // requestUrl: string;

  /**
   * 请求函数的名称，不需要带上get, update之类的前缀，处理流程会自动添加
   * @example
   *   RegionInfo  --> 生成  getRegionInfo
   */
  serviceName: string;

  /**
   * 请求返回的数据的类型，只需要带主要名字，如RegionInfo,
   * 最终会生成带上I或者C的名字
   * @example
   */
  responseDataType: string;

  /**
   * 是否转换成class
   */
  toClass: boolean;
}

type RequestMethod = 'get' | 'post' | 'delete' | 'put';

interface IGenerateFuncOptions {
  funcName: string;

  method: RequestMethod;
  requestPath: string;

  pathSchema: JSONSchema4;
  querySchema: JSONSchema4;
  bodySchema: JSONSchema4;
  responseSchema: JSONSchema4;

  /**
   * 返回的数据类型
   */
  responseType: string;

  /**
   * 是否转换成class
   */
  toClass: boolean;
}

export class GenerateServiceRequestFlowUnit extends XFlowUnit {
  /**
   * 生成请求的链接信息
   * @private
   * @param {JSONSchema4} obj 转换得到的path paremter JSON Schema4对象
   * @param {string} path 请求的路径
   * @param {IGenerateServiceRequestFlowUnitParams} flow unit的参数
   * @returns {{ requestUrl: string; pathParameterNames: string[] }} 请求的链接和请求方法中的path名字
   * @memberof GenerateServiceRequestFlowUnit
   */
  private _generateRequestPathParams(obj: JSONSchema4, path: string): { requestUrl: string; pathParameterNames: { name: string; type: string }[] } {
    if (obj.properties) {
      const pathElements: string[] = Object.keys(obj.properties);

      // 此时需要替换一下
      for (const ele of pathElements) {
        const reg = new RegExp(`{(${ele})}`);
        path = path.replace(reg, (matchedSubStr: string, p1: string) => {
          return '${' + lodash.camelCase(p1) + '}';
        });
      }

      return {
        requestUrl: `${path}`,
        pathParameterNames: pathElements.map(ele => {
          return {
            name: lodash.camelCase(ele),
            // FIXME: 这里的类型会返回数组
            // @ts-ignore
            type: (obj.properties[ele].type as string) ?? 'unknown',
          };
        }),
      };
    } else {
      // 说明没有path参数
      return {
        requestUrl: path,
        pathParameterNames: [],
      };
    }
  }

  private _getTopInterfaeType(interfaces: string[]): string {
    const collection = jscodeshift(interfaces.join('\n'), {
      parser: {
        parse(source: string) {
          return babelParser.parse(source, {
            sourceType: 'module',
            // 支持typescript, jsx
            plugins: [
              'estree',
              'typescript',
              [
                'decorators',
                {
                  decoratorsBeforeExport: true,
                },
              ],
              'exportDefaultFrom',
              'classProperties',
              'classPrivateProperties',
            ],
          });
        },
      },
    });

    const value = collection.find(jscodeshift.TSInterfaceDeclaration).get('0').node.id.name;
    return value;
  }

  /**
   * 生成携带在请求中query中的参数
   * @private
   * @param {JSONSchema4} query
   * @returns
   * @memberof GenerateServiceRequestFlowUnit
   */
  private async _generateReuqestQueryParams(
    query: JSONSchema4,
    params: {
      serviceName: string;
    }
  ): Promise<{
    name: string;
    type: string;
    fInterfaceStrs: string[];
    bInterfaceStrs: string[];
  }> {
    const unit = new InterfaceGenerateFlowUnit({ nicePropertyName: true });
    const result = await unit.doWork({
      topName: `IF${params.serviceName}QueryParams`,
      jsonSchema: query,
    });

    const bUnit = new InterfaceGenerateFlowUnit({ nicePropertyName: false });
    const bResult = await bUnit.doWork({
      topName: `IB${params.serviceName}QueryParams`,
      jsonSchema: query,
    });

    return {
      name: result.length > 0 ? 'queryParams' : '',
      type: result.length > 0 ? this._getTopInterfaeType(result) : '',
      fInterfaceStrs: result,
      bInterfaceStrs: bResult,
    };
  }

  /**
   * 生成请求中，携带在body中的参数
   * @private
   * @param {JSONSchema4} body
   * @returns
   * @memberof GenerateServiceRequestFlowUnit
   */
  private async _generateRequestBodyParams(
    body: JSONSchema4,
    params: {
      serviceName: string;
    }
  ): Promise<{
    name?: string;
    type: string;
    fInterfaceStrs: string[];
    bInterfaceStrs: string[];
  }> {
    const unit = new InterfaceGenerateFlowUnit({ nicePropertyName: true });
    const result = await unit.doWork({
      topName: `IF${params.serviceName}BodyParams`,
      jsonSchema: body,
    });

    const bUnit = new InterfaceGenerateFlowUnit({ nicePropertyName: false });
    const bResult = await bUnit.doWork({
      topName: `IB${params.serviceName}BodyParams`,
      jsonSchema: body,
    });

    return {
      name: result.length > 0 ? 'bodyParams' : undefined,
      type: result.length > 0 ? this._getTopInterfaeType(result) : '',
      fInterfaceStrs: result,
      bInterfaceStrs: bResult,
    };
  }

  /**
   * 响应
   * @param responseSchema
   * @param params
   */
  private async _generateResponseInterface(responseSchema: JSONSchema4, params: { responseDataType: string }) {
    const unit = new InterfaceGenerateFlowUnit({ nicePropertyName: true });

    const result = await unit.doWork({
      topName: `IF${params.responseDataType}Info`,
      jsonSchema: (responseSchema.properties ?? {}).data,
    });

    const buUnit = new InterfaceGenerateFlowUnit({ nicePropertyName: false });

    const bResult = await buUnit.doWork({
      topName: `IB${params.responseDataType}Info`,
      jsonSchema: (responseSchema.properties ?? {}).data,
    });

    const isNotVoid = result.length > 0;

    const fType = isNotVoid ? this._getTopInterfaeType(result) : 'void';
    const bType = isNotVoid ? this._getTopInterfaeType(bResult) : 'unknown';

    // 判断是否ListResponse，还是CommonResponse
    const isListResponse = !!(responseSchema.properties ?? {})['pager'];
    const isArray = (responseSchema.properties ?? {})['data']['type'] === 'array';

    const templateType = isArray ? `${fType}[]` : `${fType}`;
    const bTemplateType = isArray ? `${bType}[]` : `${bType}`;

    return {
      fType: fType,
      bType: bType,
      isArray: isArray,
      isListResponse: isListResponse,

      fResponseType: isListResponse ? `IListResponse<${templateType}>` : `ICommonResponse<${templateType}>`,
      bResponseType: isListResponse ? `IListResponse<${bTemplateType}>` : `ICommonResponse<${bTemplateType}>`,

      fInterfaces: result,
      bInterfaces: bResult,
    };
  }

  private async _generateGetRequestFunction(options: IGenerateFuncOptions): Promise<string> {
    // 适配函数
    // class定义

    const result = await this._generataDefinitions({
      querySchema: options.querySchema,
      bodySchema: options.bodySchema,

      responseSchema: options.responseSchema,
      serviceName: options.funcName,

      responseType: options.responseType,
    });

    const pathParams = this._generateRequestPathParams(options.pathSchema, options.requestPath);

    const toClass = options.toClass && options.method === 'get';

    // query的适配
    const queryAdaptorInfo = await this._generateAdaptors({
      fromType: result.fQueryType,
      from: result.fQueryInterface.join('\n'),
      toType: result.bQueryType,
      // to: result.bQueryInterface.join('\n'),
      isToClass: false,
      isConvertedFromFront: true,
      // type: 'QueryParams',
    });

    // body的适配
    const bodyAdaptorInfo = await this._generateAdaptors({
      from: result.fBodyInterface.join('\n'),
      fromType: result.fBodyType,

      toType: result.bBodyType,
      // to: result.bBodyInterface.join('\n'),
      isToClass: false,
      // type: 'BodyParams',
      isConvertedFromFront: true,
    });

    // response的适配
    const gcUnit = new GenerateClassFlowUnit({ convertedFromNiceFormat: true });
    const classDefines = await gcUnit.doWork(result.fResponseInterface);

    // axis请求的参数
    const axisRequestParams: string[] = [];
    if (options.method === 'get') {
      if (result.fQueryName) {
        axisRequestParams.push(`{
          params: ${queryAdaptorInfo.funcName}(${result.fQueryName})
        }`);
      }
    } else {
      if (result.fBodyName) {
        axisRequestParams.push(`${bodyAdaptorInfo.funcName}(${result.fBodyName})`);
      }

      if (result.fQueryName) {
        axisRequestParams.push(`{
          params: ${queryAdaptorInfo.funcName}(${result.fQueryName})
        }`);
      }
    }

    const errorStr = "new Error(`请求失败:(${result?.data?.errmsg || '未知原因'})`)";

    const generateName = await this._generateFuncName({ method: options.method, name: options.funcName });
    const funcParams = await this._generateFuncParams({
      pathParams: pathParams,
      fQueryName: result.fQueryName,
      fQueryType: result.fQueryType,
      fBodyName: result.fBodyName,
      fBodyType: result.fBodyType,
    });

    const responseAdaptorInfo = await this._generateAdaptors({
      from: result.bResponseInterface.join('\n'),
      fromType: result.bResponseInfoType,

      // to: toClass ? classDefines : result.fResponseInterface.join('\n'),
      toType: result.fResponseInfoType,

      isToClass: toClass,
      isConvertedFromFront: false,

      isArray: result.isReturnArray,
    });

    // response的适配
    let returnData = '';
    if (options.method === 'get') {
      returnData = result.isReturnArray
        ? `{
          ...result.data,
          data: ${responseAdaptorInfo.funcName}(result.data.data)
        }`
        : `{
        ...result.data,
        data: ${responseAdaptorInfo.funcName}(result.data.data)
      }`;
    }

    return `

      ${result.fQueryInterface.join('\n')}
      ${result.fBodyInterface.join('\n')}

      ${toClass ? classDefines : result.fResponseInterface.join('\n')}

      ${result.bQueryInterface.join('\n')}

      ${result.bBodyInterface.join('\n')}

      ${result.bResponseInterface.join('\n')}


      ${responseAdaptorInfo.func}


      export async function ${generateName}(${funcParams}): Promise<${result.fResponseDataType}> {
        const result = await http.${options.method}<${result.bResponseDataType}>(microservice.javaAdmin + \`${
      pathParams.requestUrl
    }\`, ${axisRequestParams.join(',')});

        if (isRequestSucceed(result)) {
          return ${returnData};
        } else {
          return Promise.reject(${errorStr});
        }
      }
    `;
  }

  private async _generateFuncName(options: { method: RequestMethod; name: string }): Promise<string> {
    switch (options.method) {
      case 'get':
        return `get${options.name}`;

      case 'delete':
        return `delete${options.name}`;

      case 'post':
        return `create${options.name}`;

      case 'put':
        return `update${options.name}`;

      default:
        return options.name;
    }
  }

  private async _generateFuncParams(options: {
    pathParams: {
      requestUrl: string;
      pathParameterNames: {
        name: string;
        type: string;
      }[];
    };
    fQueryType: string;
    fQueryName?: string;
    fBodyType: string;
    fBodyName?: string;
  }): Promise<string> {
    // 参数信息
    const requestParamsArr: { name: string; type: string }[] = [];
    if (options.pathParams.pathParameterNames.length > 0) {
      requestParamsArr.push(...options.pathParams.pathParameterNames);
    }

    if (options.fQueryName) {
      requestParamsArr.push({
        name: options.fQueryName,
        type: options.fQueryType,
      });
    }

    if (options.fBodyName) {
      requestParamsArr.push({
        name: options.fBodyName,
        type: options.fBodyType,
      });
    }

    const requestParams: string = requestParamsArr
      .map(item => {
        return `${item.name}: ${item.type}`;
      })
      .join(',');

    return requestParams;
  }

  private async _generateAdaptors(options: {
    fromType: string;
    from: string;
    toType: string;
    // to: string;
    isToClass: boolean;
    // type: string;
    isConvertedFromFront: boolean;
    isArray?: boolean;
  }): Promise<{ funcName: string; func: string }> {
    if (options.isToClass) {
      const gcUnit = new GenerateToClassAdaptorFlowUnit();
      const result = await gcUnit.doWork({ className: options.toType, isArray: options.isArray ?? false });
      return {
        func: result.func,
        funcName: result.funcName,
      };
    }

    const gUnit = new GenerateInterfaceAdaptor();
    const result = await gUnit.doWork({
      fromType: options.fromType,
      from: options.from,

      toType: options.toType,
      isConvertedFromFront: options.isConvertedFromFront,
    });

    return {
      funcName: result.topFuncName,
      func: result.funcStrs.join('\n'),
    };
  }

  private async _generataDefinitions(options: {
    querySchema: JSONSchema4;
    bodySchema: JSONSchema4;
    responseSchema: JSONSchema4;
    serviceName: string;
    responseType: string;
  }): Promise<{
    fQueryType: string;
    bQueryType: string;
    fQueryName?: string;
    fQueryInterface: string[];
    bQueryInterface: string[];

    fBodyType: string;
    bBodyType: string;
    fBodyName?: string;
    fBodyInterface: string[];
    bBodyInterface: string[];

    // 响应有关
    isReturnArray: boolean;
    isPager: boolean;

    fResponseInterface: string[];
    bResponseInterface: string[];

    fResponseInfoType: string;
    bResponseInfoType: string;

    fResponseDataType: string;
    bResponseDataType: string;
  }> {
    const queryParams = await this._generateReuqestQueryParams(options.querySchema, { serviceName: options.serviceName });
    const bodyParams = await this._generateRequestBodyParams(options.bodySchema, { serviceName: options.serviceName });
    const responseTypeInfo = await this._generateResponseInterface(options.responseSchema, { responseDataType: options.responseType });

    return {
      fQueryName: queryParams.name,
      fQueryType: queryParams.type,
      fQueryInterface: queryParams.fInterfaceStrs,
      bQueryType: lodash.snakeCase(queryParams.type),
      bQueryInterface: queryParams.bInterfaceStrs,

      fBodyName: bodyParams.name,
      fBodyType: bodyParams.type,
      bBodyType: lodash.snakeCase(bodyParams.type),
      fBodyInterface: bodyParams.fInterfaceStrs,
      bBodyInterface: bodyParams.bInterfaceStrs,

      fResponseInfoType: responseTypeInfo.fType,
      bResponseInfoType: responseTypeInfo.bType,

      fResponseDataType: responseTypeInfo.fResponseType,
      bResponseDataType: responseTypeInfo.bResponseType,

      isReturnArray: responseTypeInfo.isArray,
      isPager: responseTypeInfo.isListResponse,

      fResponseInterface: responseTypeInfo.fInterfaces,
      bResponseInterface: responseTypeInfo.bInterfaces,
    };
  }

  private _getPathMethod(pathItemObj: OpenAPIV2.PathItemObject): RequestMethod | undefined {
    if (pathItemObj.get) {
      return 'get';
    }

    if (pathItemObj.post) {
      return 'post';
    }

    if (pathItemObj.delete) {
      return 'delete';
    }

    if (pathItemObj.put) {
      return 'put';
    }

    return undefined;
  }

  async doWork(params: IGenerateServiceRequestFlowUnitParams): Promise<string> {
    const rsFlowUnit = new RequestSwaggerFlowUnit();
    const prcFlowUnit = new ParseRequestCodeFlowUnit();
    const spFlowUnit = new SwaggerParseFlowUnit();

    const grpsFlowUnit = new GenerateRequestParamsJsonSchemaFlowUnit();
    const grdFlowUnit = new GenerateResponseDataSchemaFlowUnit();

    const allDoc = await rsFlowUnit.doWork(params.swaggerSite);
    const requestSwaggerDoc = await prcFlowUnit.doWork([params.code, allDoc]);
    const parsedSwaggerDoc = await spFlowUnit.doWork(requestSwaggerDoc);

    // 找到path的定义

    const path = Object.keys(parsedSwaggerDoc.paths)[0] ?? '';
    assert(path !== undefined, 'path本应该存在的');

    const pathObj: OpenAPIV2.PathItemObject = parsedSwaggerDoc.paths[path];
    const method = this._getPathMethod(pathObj);
    assert(method, 'method应该存在的');

    const paramsSchema = await grpsFlowUnit.doWork(parsedSwaggerDoc);
    const responseSchema = await grdFlowUnit.doWork(parsedSwaggerDoc);

    const result = await this._generateGetRequestFunction({
      funcName: params.serviceName,
      method: method,
      requestPath: path,
      pathSchema: paramsSchema.path,
      querySchema: paramsSchema.query,
      bodySchema: paramsSchema.body,
      responseSchema: responseSchema,
      responseType: params.responseDataType,
      toClass: params.toClass,
    });

    // return prettier.format(result, {
    //   tabWidth: 2,
    //   semi: true,
    //   printWidth: 150,
    //   singleQuote: true,
    //   jsxSingleQuote: false,
    //   arrowParens: 'avoid',
    // });
    return result;
  }
}
