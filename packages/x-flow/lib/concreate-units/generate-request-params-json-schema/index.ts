import { JSONSchema4 } from 'json-schema';
import { OpenAPIV2 } from 'openapi-types';
/*
 * @name:
 * description:
 *  解析swagger文档，得到request，并将其转换成json schema
 */

import { XFlowUnit } from '../../flow-unit';

export class GenerateRequestParamsJsonSchemaFlowUnit extends XFlowUnit {
  /**
   * 获取描述
   * @param obj
   */
  private getDescription(obj: OpenAPIV2.OperationObject) {
    if (obj.summary && obj.description) {
      return `${obj.summary} 
       ${obj.description}
      `;
    }
    return obj.summary ?? obj.description ?? '';
  }

  private _convertJsonTypeDefineFromOpenApi(parameter: OpenAPIV2.GeneralParameterObject): JSONSchema4 {
    switch (parameter.type) {
      case 'array':
        return {
          type: parameter.type,
          description: parameter.description,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          items: this._convertJsonTypeDefineFromOpenApi(parameter.items),
        };

      case 'object':
        return {
          type: parameter.type,
          description: parameter.description,
          properties: parameter.properties ?? {},
        };

      case 'string':
      case 'number':
      case 'integer':
      case 'boolean':
        return {
          type: parameter.type,
          description: parameter.description ?? '',
        };
    }
  }

  /**
   * 将swagger文档中的请求参数转换成符合scheme 结构的properties
   * @private
   * @param {OpenAPIV2.Parameter[]} parameters
   * @memberof GenerateRequestJsonSchema
   */
  private convertParameters(parameters: OpenAPIV2.Parameter[]): { [k: string]: JSONSchema4 } | undefined {
    const result = parameters
      .filter(par => {
        // 过滤掉header中的参数，因为是用户权限，统一设置
        return par.in !== 'header';
      })
      .filter(par => {
        // 过滤掉path中的参数，这部分参数另外处理
        return par.in !== 'path';
      })
      .filter(par => {
        // 过滤body中的参数，这部分随后处理
        return par.in !== 'body';
      })
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .map((par: OpenAPIV2.GeneralParameterObject) => {
        // 因为我们过滤了
        const result: JSONSchema4 = {
          [par.name]: this._convertJsonTypeDefineFromOpenApi(par),
        };
        return result;
      })
      .reduce((accum, current) => {
        return {
          ...accum,
          ...current,
        };
      }, {});

    return result;
  }

  private findRequestInPath(obj: OpenAPIV2.Document): OpenAPIV2.OperationObject | undefined {
    const paths: OpenAPIV2.PathItemObject[] = Object.values(obj.paths);
    if (paths[0]) {
      const firstPath = paths[0];

      return firstPath.get ?? firstPath.post ?? firstPath.del ?? firstPath.put ?? undefined;
    }

    return undefined;
  }

  private getRequeiredParamers(parameters: OpenAPIV2.Parameter[]): string[] {
    return parameters
      .filter(par => {
        return par.in !== 'header' && par.in !== 'path';
      })
      .filter(par => {
        return par.required === true;
      })
      .map(par => par.name);
  }

  async doWork(operationObj: OpenAPIV2.Document): Promise<JSONSchema4> {
    // 找到path中的请求对象

    const requestDef = this.findRequestInPath(operationObj);
    if (!requestDef) {
      throw Error('没有找到请求的定义');
    }

    const result: JSONSchema4 = {
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: this.getDescription(requestDef),
      type: 'object',
      properties: this.convertParameters((requestDef.parameters ?? []) as OpenAPIV2.Parameter[]),
      required: this.getRequeiredParamers((requestDef.parameters ?? []) as OpenAPIV2.Parameter[]),
    };

    return result;
  }
}
