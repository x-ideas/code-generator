/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * @name:
 * description:
 *  解析swagger文档，得到request，并将其转换成json schema
 */

import { JSONSchema4 } from 'json-schema';
import { OpenAPIV2 } from 'openapi-types';
import lodash from 'lodash';

import { XFlowUnit } from '../../flow-unit';

interface IGenerateRequestParamsSchemaResult {
  path: JSONSchema4;
  body: JSONSchema4;
  query: JSONSchema4;
}

function isInBodyParameterObject(parameter: OpenAPIV2.Parameter): parameter is OpenAPIV2.InBodyParameterObject {
  return parameter.in === 'body';
}

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
          items: this.generateItemJsonSchema(parameter.items, {}, []),
        };

      case 'object':
        return {
          type: parameter.type,
          description: parameter.description,
          properties: this.generatePropertiesJSONSchema(parameter.properties ?? {}, {}, []),
        };

      case 'string':
      case 'number':
      case 'integer':
      case 'boolean':
        return {
          type: parameter.type,
          description: parameter.description ?? '',
        };

      default:
        return {};
    }
  }

  /**
   * 解析path参数
   * @private
   * @param {OpenAPIV2.Parameter[]} parameters
   * @returns {{
   *     [name: string]: JSONSchema4;
   *   }}
   * @memberof GenerateRequestParamsJsonSchemaFlowUnit
   */
  private convertPathParemters(
    parameters: OpenAPIV2.Parameter[]
  ): {
    [name: string]: JSONSchema4;
  } {
    return (
      parameters
        .filter(par => {
          return par.in === 'path';
        })
        // @ts-ignore
        .map((par: OpenAPIV2.GeneralParameterObject) => {
          return {
            [par.name]: this._convertJsonTypeDefineFromOpenApi(par),
          };
        })
        .reduce((accum, current) => {
          return {
            ...accum,
            ...current,
          };
        }, {})
    );
  }

  /**
   * 获得必填的path参数
   * @private
   * @param {OpenAPIV2.Parameter[]} parameters
   * @returns {string[]}
   * @memberof GenerateRequestParamsJsonSchemaFlowUnit
   */
  private getRequeiredPathParemters(parameters: OpenAPIV2.Parameter[]): string[] {
    return parameters
      .filter(par => {
        return par.in === 'path';
      })
      .filter(par => {
        return par.required === true;
      })
      .map(par => par.name);
  }

  private generateItemJsonSchema(
    items?: OpenAPIV2.ItemsObject,
    defs: OpenAPIV2.DefinitionsObject = {},
    refs: string[] = []
  ): JSONSchema4 | JSONSchema4[] | undefined {
    if (items) {
      if (items.$ref) {
        if (!refs.includes(items.$ref)) {
          // @ts-ignore
          throw Error('此时不应该出现ref，马上联系管理员');
          // this.dealWithRef(items.$ref, defs, refs, items?.description);
        }
      }

      switch (items.type) {
        case 'array': {
          return {
            type: items.type,
            items: this.generateItemJsonSchema(items.items, defs, refs),
          };
        }

        case 'object': {
          // 此时ref被填充
          return {
            type: items.type,
            // @ts-ignore
            description: items.title ?? '',
            // @ts-ignore
            properties: this.generatePropertiesJSONSchema(items.properties ?? {}, defs, refs),
          };
        }

        case 'string':
        case 'number':
        case 'integer':
        case 'boolean':
          return {
            type: items.type,
            description: 'item-暂无',
          };
      }
    }

    return undefined;
  }

  private generateJSonSchemaFromOpenAPISchema(
    schema: OpenAPIV2.SchemaObject,
    defs: OpenAPIV2.DefinitionsObject,
    refs: string[],
    description?: string
  ): JSONSchema4 {
    if (schema.$ref && !refs.includes(schema.$ref)) {
      throw Error('此时不应该存在ref, 或者这是一个错误');
    }

    switch (schema.type) {
      case 'array': {
        const items = schema.items;
        return {
          type: schema.type,
          description: schema.description ?? schema.title ?? description,
          items: this.generateItemJsonSchema(items, defs, refs),
        };
      }

      case 'object': {
        return {
          type: schema.type,
          description: schema.description ?? description,
          properties: this.generatePropertiesJSONSchema(schema.properties ?? {}, defs, refs),
        };
      }

      case 'string':
      case 'number':
      case 'integer':
      case 'boolean':
        return {
          type: schema.type,
          description: schema.description ?? description,
          // default: schema.default,
          // required: schema.required,
        };

      default:
        return {};
    }
  }

  private generatePropertiesJSONSchema(
    properties: { [key: string]: OpenAPIV2.SchemaObject },
    defs: OpenAPIV2.DefinitionsObject,
    refs: string[],
    description = ''
  ): { [key: string]: JSONSchema4 } {
    const result: { [key: string]: JSONSchema4 } = {};
    for (const key of Object.keys(properties)) {
      const property = properties[key];

      result[key] = this.generateJSonSchemaFromOpenAPISchema(property, defs, refs, description);
    }

    return result;
  }

  private convertBodyParemeters(parameters: OpenAPIV2.Parameter[]): { [name: string]: JSONSchema4 } {
    return (
      parameters
        .filter(par => {
          return par.in === 'body';
        })
        // @ts-ignore
        .map((par: OpenAPIV2.GeneralParameterObject) => {
          if (par.schema) {
            // this.generateJSonSchemaFromOpenAPISchema(par.schema, {}, []);

            // const result: JSONSchema4 = {
            //   type: par.schema.type ?? 'object',
            //   description: par.schema.description ?? par.schema.title ?? '',
            //   properties: this.generatePropertiesJSONSchema(par.schema.properties ?? {}, {}, []),
            // };
            return {
              [par.name]: this.generateJSonSchemaFromOpenAPISchema(par.schema, {}, [], par.description),
            };
          }
          return {
            [par.name]: this._convertJsonTypeDefineFromOpenApi(par),
          };
        })
        .reduce((accum, current) => {
          return {
            ...accum,
            ...current,
          };
        }, {})
    );
  }

  private convertQueryParemeters(parameters: OpenAPIV2.Parameter[]): { [name: string]: JSONSchema4 } {
    return (
      parameters
        .filter(par => {
          return par.in === 'query';
        })
        // @ts-ignore
        .map((par: OpenAPIV2.GeneralParameterObject) => {
          return {
            [par.name]: this._convertJsonTypeDefineFromOpenApi(par),
          };
        })
        .reduce((accum, current) => {
          return {
            ...accum,
            ...current,
          };
        }, {})
    );
  }

  private getRequeiredQueryParemters(parameters: OpenAPIV2.Parameter[]): string[] {
    return parameters
      .filter(par => {
        return par.in === 'query';
      })
      .filter(par => {
        return par.required === true;
      })
      .map(par => par.name);
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
      // .filter(par => {
      //   // 过滤掉path中的参数，这部分参数另外处理
      //   return par.in !== 'path';
      // })
      .map((par: OpenAPIV2.Parameter) => {
        if (par.in === 'path') {
          // 路径参数
          const result: JSONSchema4 = {
            path: {
              [par.name]: this._convertJsonTypeDefineFromOpenApi(par as OpenAPIV2.GeneralParameterObject),
            },
          };
          return result;
        }

        if (isInBodyParameterObject(par)) {
          const result: JSONSchema4 = {
            body: par.schema,
          };
          return result;
        } else {
          const result: JSONSchema4 = {
            [par.in]: {
              [par.name]: this._convertJsonTypeDefineFromOpenApi(par),
            },
          };
          return result;
        }
      })
      .reduce((accum, current) => {
        return lodash.merge(accum, current);
      }, {});

    return result;
  }

  private findRequestInPath(obj: OpenAPIV2.Document): OpenAPIV2.OperationObject | undefined {
    const paths: OpenAPIV2.PathItemObject[] = Object.values(obj.paths);
    if (paths[0]) {
      const firstPath = paths[0];

      return firstPath.get ?? firstPath.post ?? firstPath.delete ?? firstPath.put ?? undefined;
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
      .map(par => {
        if (par.in === 'body') {
          return 'body';
        } else {
          return par.name;
        }
      });
  }

  async doWork(operationObj: OpenAPIV2.Document): Promise<IGenerateRequestParamsSchemaResult> {
    // 找到path中的请求对象

    const requestDef = this.findRequestInPath(operationObj);
    if (!requestDef) {
      throw Error('没有找到请求的定义');
    }

    return {
      path: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        description: this.getDescription(requestDef),
        // NOTE: 以为先用swagger parse进行处理，我们这里先不考虑ref
        properties: this.convertPathParemters((requestDef.parameters ?? []) as OpenAPIV2.Parameter[]),
        required: this.getRequeiredPathParemters((requestDef.parameters ?? []) as OpenAPIV2.Parameter[]),
      },
      body: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        description: this.getDescription(requestDef),
        properties: this.convertBodyParemeters((requestDef.parameters ?? []) as OpenAPIV2.Parameter[]),
        required: [],
      },
      query: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        description: this.getDescription(requestDef),
        properties: this.convertQueryParemeters((requestDef.parameters ?? []) as OpenAPIV2.Parameter[]),
        required: this.getRequeiredQueryParemters((requestDef.parameters ?? []) as OpenAPIV2.Parameter[]),
      },
    };
  }
}
