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

export class ParseRequestCodeFlowUnit extends XFlowUnit {
  private findPath(code: string, doc: OpenAPIV2.Document): OpenAPIV2.PathsObject | undefined {
    const reg = new RegExp(code);
    for (const pathKey of Object.keys(doc.paths)) {
      const pathInfo = doc.paths[pathKey];
      if ((pathInfo as OpenAPIV2.PathItemObject).get?.summary?.match(reg)) {
        return {
          [pathKey]: {
            get: (pathInfo as OpenAPIV2.PathItemObject).get,
          },
        };
      }

      if ((pathInfo as OpenAPIV2.PathItemObject).post?.summary?.match(reg)) {
        return {
          [pathKey]: {
            post: (pathInfo as OpenAPIV2.PathItemObject).post,
          },
        };
      }

      if ((pathInfo as OpenAPIV2.PathItemObject).del?.summary?.match(reg)) {
        return {
          [pathKey]: {
            del: (pathInfo as OpenAPIV2.PathItemObject).del,
          },
        };
      }

      if ((pathInfo as OpenAPIV2.PathItemObject).put?.summary?.match(reg)) {
        return {
          [pathKey]: {
            put: (pathInfo as OpenAPIV2.PathItemObject).put,
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

      if (obj.del) {
        return obj.del;
      }

      if (obj.put) {
        return obj.put;
      }
    }

    return undefined;
  }

  /**
   * 从path中找到相关的ref(绝对/相对)
   * 包含参数和响应部分
   * 通过这些ref，去过滤json API中definitions中的定义
   * @param {OpenAPIV2.OperationObject} path
   * @returns {string[]}
   * @memberof ParseRequestCodeFlowUnit
   */
  private findRelatedDefinitionsRefs(path?: OpenAPIV2.OperationObject): string[] {
    if (!path) {
      throw new Error('path路径不存在');
    }

    const refs: string[] = [];
    // 参数
    const params = path.parameters;
    if (params) {
      for (const par of params) {
        if (isParamsRefObject(par)) {
          refs.push(par.$ref);
        } else {
          if (isSchemaRefObject(par.schema)) {
            refs.push(par.schema.$ref);
          } else {
            // 剩下的就是Shema了
            // 不做处理
          }
        }
      }
    }

    // 响应
    if (path.responses['200']) {
      const successResponse = path.responses['200'] as OpenAPIV2.Response;

      if (isResponseRefObject(successResponse)) {
        refs.push(successResponse.$ref);
      } else {
        if (isSchemaRefObject(successResponse.schema)) {
          refs.push(successResponse.schema.$ref);
        } else {
          // 剩下的就是Shema了
          // 不做处理
        }
      }
    }

    return refs;
  }

  /**
   *
   * @private
   * @param {OpenAPIV2.SchemaObject} def
   * @param {OpenAPIV2.DefinitionsObject} definitions
   * @returns {string[]}
   * @memberof ParseRequestCodeFlowUnit
   */
  private findRelatedDefinitionRefsFromDefinition(def: OpenAPIV2.SchemaObject, definitions: OpenAPIV2.DefinitionsObject, results: string[]): void {
    function parseItems(res: string[], item?: OpenAPIV2.ItemsObject) {
      if (item?.$ref) {
        res.push(item.$ref);
      }

      if (item?.type === 'array') {
        const items = item.items as OpenAPIV2.ItemsObject;
        parseItems(res, items);
      }
    }

    const properties = def.properties ?? {};

    for (const property of Object.values(properties)) {
      if (property.$ref) {
        results.push(property.$ref);
        continue;
      }

      // 解析items
      parseItems(results, property.items);

      this.findRelatedDefinitionRefsFromDefinition(property, definitions, results);
    }
  }

  async doWork(params: [string, OpenAPIV2.Document]): Promise<OpenAPIV2.Document> {
    // 只找到code对应的一个最小文档
    const code = params[0];
    const doc = params[1];

    const path = this.findPath(code, doc);
    if (!path) {
      throw Error(`没有找到code[${code}]对应的path信息`);
    }

    // 找定义
    const definitions: OpenAPIV2.DefinitionsObject = {};

    const pathOperationObj = this._findOperationObjectFromPath(path);
    if (!pathOperationObj) {
      throw Error('path路径下边没有找到对应operation对象');
    }
    const relativeRefs = this.findRelatedDefinitionsRefs(pathOperationObj).filter(ref => {
      // 只找出相对ref
      return ref.startsWith('#');
    });

    // model中带的refs
    // eslint-disable-next-line prefer-const
    let modelRefs: string[] = [];
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
        definitions[defKey] = def;

        this.findRelatedDefinitionRefsFromDefinition(def, doc.definitions ?? {}, modelRefs);
      }
    }

    // model中带入的def
    for (const defKey of Object.keys(doc.definitions ?? {})) {
      if (
        modelRefs.find(rref => {
          const elements = rref.split('/');
          const lastElement = elements.length > 0 ? elements[elements.length - 1] : '';

          return lastElement === defKey;
        })
      ) {
        const def = (doc.definitions ?? {})[defKey];
        definitions[defKey] = def;
      }
    }

    return {
      swagger: doc.swagger,
      info: doc.info,
      paths: path,
      definitions: definitions,
    };
  }
}
