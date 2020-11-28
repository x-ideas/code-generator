/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * @name:
 * description:
 *  解析swagger文档，过滤其他无用的信息，值
 * 获得请求code对应的openAPI文档
 *
 */

import { OpenAPIV2 } from 'openapi-types';
import { XFlowUnit } from '../../flow-unit';

function isParamsRefObject(obj: OpenAPIV2.ReferenceObject | OpenAPIV2.Parameter): obj is OpenAPIV2.ReferenceObject {
  return !!obj?.$ref;
}

function isSchemaRefObject(obj?: OpenAPIV2.ReferenceObject | OpenAPIV2.SchemaObject): obj is OpenAPIV2.ReferenceObject {
  return !!obj?.$ref;
}

function isResponseRefObject(obj?: OpenAPIV2.ReferenceObject | OpenAPIV2.ResponseObject): obj is OpenAPIV2.ReferenceObject {
  // @ts-ignore
  return !!obj?.$ref;
}

function isInBodyParameterObject(obj: OpenAPIV2.Parameter): obj is OpenAPIV2.InBodyParameterObject {
  return obj.in === 'body';
}

function isInPathParameterObject(obj: OpenAPIV2.Parameter): obj is OpenAPIV2.GeneralParameterObject {
  return obj.in === 'path';
}

export class ParseRequestCodeFlowUnit extends XFlowUnit {
  /**
   * 根据code找到对应的path对象
   * @private
   * @param {string} code
   * @param {OpenAPIV2.Document} doc
   * @returns {(OpenAPIV2.PathsObject | undefined)}
   * @memberof ParseRequestCodeFlowUnit
   */
  private findRequestPathObject(code: string, doc: OpenAPIV2.Document): OpenAPIV2.PathsObject | undefined {
    function _filterUnValidPropertyOfParemeters(obj: OpenAPIV2.OperationObject): OpenAPIV2.OperationObject {
      if (obj.parameters) {
        for (const value of Object.values(obj.parameters)) {
          if (isParamsRefObject(value)) {
            // do nothing
          } else if (isInPathParameterObject(value)) {
            value.required = true;
          }
        }
      }

      return obj;
    }

    const reg = new RegExp(code);
    for (const pathKey of Object.keys(doc.paths)) {
      const pathInfo = doc.paths[pathKey] as OpenAPIV2.PathItemObject;
      if (pathInfo.get?.summary?.match(reg)) {
        return {
          [pathKey]: {
            get: _filterUnValidPropertyOfParemeters(pathInfo.get),
          },
        };
      }

      if (pathInfo.post?.summary?.match(reg)) {
        return {
          [pathKey]: {
            post: _filterUnValidPropertyOfParemeters(pathInfo.post),
          },
        };
      }

      if (pathInfo.delete?.summary?.match(reg)) {
        return {
          [pathKey]: {
            delete: _filterUnValidPropertyOfParemeters(pathInfo.delete),
          },
        };
      }

      if (pathInfo.put?.summary?.match(reg)) {
        return {
          [pathKey]: {
            put: _filterUnValidPropertyOfParemeters(pathInfo.put),
          },
        };
      }
    }
  }

  /**
   * 从path中找到对应的operationObject
   * 这里的path已经经过code的一次过滤，所以我们只获取第一个OperationObject
   * @private
   * @param {OpenAPIV2.PathsObject} path
   * @returns {(OpenAPIV2.OperationObject | undefined)}
   * @memberof ParseRequestCodeFlowUnit
   */
  private _findOperationObjectFromPath(path: OpenAPIV2.PathsObject): OpenAPIV2.OperationObject | undefined {
    const objs: OpenAPIV2.PathItemObject[] = Object.values(path);
    for (const obj of objs) {
      if (obj.get) {
        return obj.get;
      }

      if (obj.post) {
        return obj.post;
      }

      if (obj.delete) {
        return obj.delete;
      }

      if (obj.put) {
        return obj.put;
      }
    }

    return undefined;
  }

  //#region 寻找Ref
  /******************** 寻找ref START *****************/

  /**
   * 是否是相对的ref
   * @private
   * @param {string} ref
   * @returns {boolean}
   * @memberof ParseRequestCodeFlowUnit
   */
  private _isRelativeRef(ref: string): boolean {
    return ref.startsWith('#');
  }

  /**
   * 找到相对ref对应的schema对象
   * @private
   * @param {string} ref
   * @param {OpenAPIV2.DefinitionsObject} [definitions={}]
   * @returns {(OpenAPIV2.SchemaObject | undefined)}
   * @memberof ParseRequestCodeFlowUnit
   */
  private _findRelativeRefSchema(ref: string, definitions: OpenAPIV2.DefinitionsObject = {}): OpenAPIV2.SchemaObject | undefined {
    const elements = ref.split('/');
    const key = elements.length > 0 ? elements[elements.length - 1] : '';

    return definitions[key];
  }

  /**
   * 找到properties中的ref链接
   * @private
   * @param {{ [name: string]: OpenAPIV2.SchemaObject }} properties
   * @param {string[]} results
   * @memberof ParseRequestCodeFlowUnit
   */
  private _findRefFromProperties(
    properties: { [name: string]: OpenAPIV2.SchemaObject },
    results: string[],
    definitions: OpenAPIV2.DefinitionsObject = {}
  ): void {
    const values = Object.values(properties);

    for (const value of values) {
      this._findRefFromSchemaObject(value, results, definitions);
    }
  }

  /**
   * 从ItemObject中解析出ref
   * @private
   * @param {OpenAPIV2.ItemsObject} itemObj
   * @param {string[]} results
   * @memberof ParseRequestCodeFlowUnit
   */
  private _findRefFromItemObject(itemObj: OpenAPIV2.ItemsObject, results: string[], definitions: OpenAPIV2.DefinitionsObject = {}): void {
    if (itemObj.$ref) {
      if (!results.includes(itemObj.$ref)) {
        results.push(itemObj.$ref);
        // 找到ref对应的schema
        this._interaterDealWithRef(itemObj.$ref, definitions, results);
      }
    }

    if (itemObj.items) {
      this._findRefFromItemObject(itemObj.items, results, definitions);
    }
  }

  /**
   * 从ref中找到对应的schema，然后继续迭代查找ref
   * @private
   * @param {OpenAPIV2.ItemsObject} itemObj
   * @param {OpenAPIV2.DefinitionsObject} definitions
   * @param {string[]} results
   * @memberof ParseRequestCodeFlowUnit
   */
  private _interaterDealWithRef(ref: string, definitions: OpenAPIV2.DefinitionsObject, results: string[]) {
    if (this._isRelativeRef(ref)) {
      const schemaObj = this._findRelativeRefSchema(ref, definitions);
      if (schemaObj) {
        this._findRefFromSchemaObject(schemaObj, results, definitions);
      } else {
        console.error(`没有找到 ${ref} 对应的schema`);
      }
    }
  }

  private _findRefFromSchema(schema: OpenAPIV2.Schema, results: string[], definitions: OpenAPIV2.DefinitionsObject = {}): void {
    if (isSchemaRefObject(schema)) {
      results.push(schema.$ref);
      // 找到ref对应的schema
      this._interaterDealWithRef(schema.$ref, definitions, results);
    } else {
      this._findRefFromSchemaObject(schema, results, definitions);
    }
  }

  /**
   * 找到schema object中的ref链接
   * @private
   * @param {OpenAPIV2.SchemaObject} schemaObj
   * @param {string[]} results
   * @memberof ParseRequestCodeFlowUnit
   */
  private _findRefFromSchemaObject(schemaObj: OpenAPIV2.SchemaObject, results: string[], definitions: OpenAPIV2.DefinitionsObject = {}): void {
    // NOTE: 这是是我们swagger文档添加的
    if (schemaObj.$ref) {
      if (!results.includes(schemaObj.$ref)) {
        results.push(schemaObj.$ref);
        // 找到ref对应的schema
        this._interaterDealWithRef(schemaObj.$ref, definitions, results);
      }
    }

    if (schemaObj.items) {
      this._findRefFromItemObject(schemaObj.items, results, definitions);
    }

    this._findRefFromProperties(schemaObj.properties ?? {}, results, definitions);
  }

  /**
   * 寻找参数中的ref
   * @private
   * @param {OpenAPIV2.Parameters} parameters
   * @param {string[]} results
   * @memberof ParseRequestCodeFlowUnit
   */
  private _findRefFromParameters(parameters: OpenAPIV2.Parameters, results: string[], definitions: OpenAPIV2.DefinitionsObject = {}): void {
    for (const par of parameters) {
      if (isParamsRefObject(par)) {
        if (!results.includes(par.$ref)) {
          results.push(par.$ref);
          // 找到ref对应的schema
          this._interaterDealWithRef(par.$ref, definitions, results);
        }
      } else {
        this._findRefFromParameter(par, results, definitions);
      }
    }
  }

  /**
   * 在具体的参数对象中ref
   * @private
   * @param {OpenAPIV2.Parameter} parameter
   * @param {string[]} results
   * @memberof ParseRequestCodeFlowUnit
   */
  private _findRefFromParameter(parameter: OpenAPIV2.Parameter, results: string[], definitions: OpenAPIV2.DefinitionsObject = {}): void {
    if (isInBodyParameterObject(parameter)) {
      // In body parameter
      this._findRefFromSchema(parameter.schema, results, definitions);
      // if (parameter.schema.$ref) {
      //   if (!results.includes(parameter.schema.$ref)) {
      //     results.push(parameter.schema.$ref);
      //     // 找到ref对应的schema
      //     this._interaterDealWithRef(parameter.schema.$ref, definitions, results);
      //   }
      // }
    } else {
      // 此时parameter继承ItemObject
      this._findRefFromItemObject(parameter, results, definitions);
    }
  }

  /**
   * 从response中解析出ref
   * @private
   * @param {OpenAPIV2.Response} response
   * @param {string[]} results
   * @memberof ParseRequestCodeFlowUnit
   */
  private _findRefFromResponse(response: OpenAPIV2.Response, results: string[], definitions: OpenAPIV2.DefinitionsObject = {}): void {
    if (isResponseRefObject(response)) {
      if (!results.includes(response.$ref)) {
        results.push(response.$ref);
        // 找到ref对应的schema
        this._interaterDealWithRef(response.$ref, definitions, results);
      }
    } else {
      if (response.schema) {
        this._findRefFromSchema(response.schema, results, definitions);
      }
    }
  }

  /******************** 寻找ref END *****************/
  //#endregion

  /**
   * 从path中找到相关的ref(绝对/相对)
   * 包含参数和响应部分
   * 通过这些ref，去过滤json API中definitions中的定义
   * @param {OpenAPIV2.OperationObject} path
   * @param {OpenAPIV2.DefinitionsObject} definitions 所有的定义
   * @returns {string[]}
   * @memberof ParseRequestCodeFlowUnit
   */
  private findRelatedDefinitionsRefs(path?: OpenAPIV2.OperationObject, definitions: OpenAPIV2.DefinitionsObject = {}): string[] {
    if (!path) {
      throw new Error('path路径不存在');
    }

    const refs: string[] = [];
    // 参数
    const params = path.parameters;
    if (params) {
      this._findRefFromParameters(params, refs, definitions);
    }

    // 响应
    if (path.responses['200']) {
      const successResponse = path.responses['200'] as OpenAPIV2.Response;
      this._findRefFromResponse(successResponse, refs, definitions);
    }

    return refs;
  }

  /**
   * 删除属性中的allowEmptyValue
   * 这是因为我们项目中的swagger文档不符合规范
   * @private
   * @param {OpenAPIV2.SchemaObject} def
   * @returns {OpenAPIV2.SchemaObject}
   * @memberof ParseRequestCodeFlowUnit
   */
  private _filterDefinitionItemProperty(def: OpenAPIV2.SchemaObject): OpenAPIV2.SchemaObject {
    Reflect.deleteProperty(def, 'allowEmptyValue');

    for (const prop of Object.values(def.properties ?? {})) {
      this._filterDefinitionItemProperty(prop);
    }

    return def;
  }

  async doWork(params: [string, OpenAPIV2.Document]): Promise<OpenAPIV2.Document> {
    // 只找到code对应的一个最小文档
    const code = params[0];
    const doc = params[1];

    const path = this.findRequestPathObject(code, doc);
    if (!path) {
      throw Error(`没有找到code[${code}]对应的path信息`);
    }

    // 找定义
    const definitions: OpenAPIV2.DefinitionsObject = {};

    const pathOperationObj = this._findOperationObjectFromPath(path);
    if (!pathOperationObj) {
      throw Error('path路径下边没有找到对应operation对象');
    }
    const relativeRefs = this.findRelatedDefinitionsRefs(pathOperationObj, doc.definitions ?? {}).filter(ref => {
      // 只找出相对ref
      return ref.startsWith('#');
    });

    // 过滤doc的definitions
    for (const defKey of Object.keys(doc.definitions ?? {})) {
      if (
        relativeRefs.find(rref => {
          const elements = rref.split('/');
          const lastElement = elements.length > 0 ? elements[elements.length - 1] : '';

          return lastElement === defKey;
        })
      ) {
        const def = (doc.definitions ?? {})[defKey];
        definitions[defKey] = this._filterDefinitionItemProperty(def);
      }
    }

    return {
      swagger: doc.swagger,
      info: doc.info,
      paths: path,
      definitions: definitions,
      // definitions: doc.definitions,
    };
  }
}
