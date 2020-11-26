/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * @name:
 * description:
 *  生成service的FlowUnit
 */

import assert from 'assert';
import lodash from 'lodash';
import { JSONSchema4 } from 'json-schema';
import { XFlowUnit } from '../../flow-unit';
import { GenerateRequestParamsJsonSchemaFlowUnit } from '../generate-request-params-json-schema';
import { GenerateResponseDataSchemaFlowUnit } from '../generate-response-data-schema';
import { RequestSwaggerFlowUnit } from '../request-swagger/request-swagger-unit';
import { SwaggerParseFlowUnit } from '../swagger-parse';
import { ParseRequestCodeFlowUnit } from './../parse-request-code/parser-request-code-unit';
import { InterfaceGenerateFlowUnit } from '../generate-interface';
import { OpenAPIV2 } from 'openapi-types';

interface IGenerateServiceRequestFlowUnitParams {
  /**
   * 请求的code
   */
  code: string;
  /**
   * swagger文档地址
   */
  swaggerSite: string;
  /**
   * 类名
   */
  className: string;

  /**
   * 请求的地址（不包括路径）
   * @example
   * http://ja.api.dev.pupuvip.com
   */
  requestUrl: string;

  /**
   * 请求函数的名称
   */
  serviceName: string;

  /**
   * 请求返回的数据的类型
   */
  responseDataType: string;
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
  private _generateRequestPathParams(
    obj: JSONSchema4,
    path: string,
    params: IGenerateServiceRequestFlowUnitParams
  ): { requestUrl: string; pathParameterNames: { name: string; type: string }[] } {
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
            type: (obj.properties[ele].type as string) ?? 'unknown',
          };
        }),
      };
    } else {
      // 说明没有path参数
      return {
        requestUrl: `${params.requestUrl}${path}`,
        pathParameterNames: [],
      };
    }
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
    params: IGenerateServiceRequestFlowUnitParams
  ): Promise<{
    name: string;
    type: string;
  }> {
    const unit = new InterfaceGenerateFlowUnit({ nicePropertyName: true });
    const result = await unit.doWork({
      topName: `${params.serviceName}QueryParams`,
      jsonSchema: query,
    });

    // NOTE: 找到interface对应的名字
    return {
      name: result.length > 0 ? 'queryParams' : '',
      type: result.length > 0 ? `IF${params.serviceName}QueryParams` : '',
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
    params: IGenerateServiceRequestFlowUnitParams
  ): Promise<{
    name: string;
    type: string;
  }> {
    const unit = new InterfaceGenerateFlowUnit({ nicePropertyName: true });
    const result = await unit.doWork({
      topName: `${params.serviceName}BodyParams`,
      jsonSchema: body,
    });

    // FIXME: 找到interface对应的名字

    return {
      name: result.length > 0 ? 'bodyParams' : '',
      type: result.length > 0 ? `IF${params.serviceName}BodyParams` : '',
    };
  }

  private async _generateResponseInterface(responseSchema: JSONSchema4, params: IGenerateServiceRequestFlowUnitParams) {
    const unit = new InterfaceGenerateFlowUnit({ nicePropertyName: true });

    const result = await unit.doWork({
      // FIXME: 这个类型的名称
      topName: `${params.responseDataType}Info`,
      // NOTE: 只解析data
      jsonSchema: (responseSchema.properties ?? {}).data,
    });

    // FIXME: 类型
    const isNotVoid = result.length > 0;

    const type = isNotVoid ? `IF${params.responseDataType}Info` : 'void';

    // 判断是否ListResponse，还是CommonResponse

    const isListResponse = !!(responseSchema.properties ?? {})['pager'];
    const isArray = (responseSchema.properties ?? {})['data']['type'] === 'array';

    const templateType = isArray ? `${type}[]` : `${type}`;

    return {
      type: type,
      isArray: isArray,
      isListResponse: isListResponse,
      responseType: isListResponse ? `IListResponse<${templateType}>` : `ICommonResponse<${templateType}>`,
    };
  }

  // private _generateDeleteRequestFunction(): string {}

  // private _generatePutRequestFunction(): string {}

  // private _generatePostequestFunction(): string {}

  // private _generateGetRequestFunction(): string {
  //   // 函数名字
  //   // 函数入参
  //   // 函数出参
  //   // 请求链接
  //   // 请求方法
  //   // 适配函数
  //   // class定义
  // }

  private _getPathMethod(pathItemObj: OpenAPIV2.PathItemObject): string | undefined {
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

  async doWork(params: IGenerateServiceRequestFlowUnitParams) {
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

    const pathParams = this._generateRequestPathParams(paramsSchema.path, path, params);
    const queryParams = await this._generateReuqestQueryParams(paramsSchema.query, params);
    const bodyParams = await this._generateRequestBodyParams(paramsSchema.body, params);

    // 参数信息
    const requestParamsArr: { name: string; type: string }[] = [];
    if (pathParams.pathParameterNames.length > 0) {
      requestParamsArr.push(...pathParams.pathParameterNames);
    }

    if (queryParams.name) {
      requestParamsArr.push(queryParams);
    }

    if (bodyParams.name) {
      requestParamsArr.push(bodyParams);
    }

    const requestParams: string = requestParamsArr
      .map(item => {
        return `${item.name}: ${item.type}`;
      })
      .join(',');

    // TODO: 函数备注信息

    // 函数的返回类型
    const responseTypeInfo = await this._generateResponseInterface(responseSchema, params);

    const errorStr = "new Error(`请求失败:(${result?.data?.errmsg || '未知原因'})`)";

    // 适配函数

    // 生成函数
    const funcStr = `export async function ${params.serviceName}(${requestParams}): Promise<${responseTypeInfo.responseType}> {
        const result = await http.${method}<${responseTypeInfo.responseType}>(microservice.javaAdmin + ${pathParams.requestUrl});

        if (isRequestSucceed(result)) {
          return result.data;
        } else {
          return Promise.reject(${errorStr});
        }
    }`;

    return funcStr;
  }
}
