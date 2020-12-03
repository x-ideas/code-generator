/* eslint-disable @typescript-eslint/ban-ts-comment */
import { OpenAPIV2 } from 'openapi-types';
import { JSONSchema4 } from 'json-schema';
import { XFlowUnit } from '../../flow-unit';

function isResponseRefObj(obj: OpenAPIV2.Response): obj is OpenAPIV2.ReferenceObject {
  return '$ref' in obj;
}

function isSchemaRefObj(obj: OpenAPIV2.Schema): obj is OpenAPIV2.ReferenceObject {
  return '$ref' in obj;
}

export interface IGenerateResponseDataSchemaFlowUnitResult {
  isPageList: boolean;
  dataSchema: JSONSchema4;
}

export class GenerateResponseDataSchemaFlowUnit extends XFlowUnit {
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

  private findRequestInPath(obj: OpenAPIV2.Document): OpenAPIV2.OperationObject | undefined {
    const paths: OpenAPIV2.PathItemObject[] = Object.values(obj.paths);
    if (paths[0]) {
      const firstPath = paths[0];

      return firstPath.get ?? firstPath.post ?? firstPath.delete ?? firstPath.put ?? undefined;
    }

    return undefined;
  }

  private findSucceedResponse(path: OpenAPIV2.OperationObject): OpenAPIV2.Response | undefined {
    return path.responses[200] ?? undefined;
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
          this.dealWithRef(items.$ref, defs, refs, items?.description);
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
      return this.dealWithRef(schema.$ref, defs, refs, schema.description) ?? {};
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
          default: schema.default,
          required: schema.required,
        };

      default:
        return {};
    }
  }

  private generateSchema(schema: OpenAPIV2.Schema, defs: OpenAPIV2.DefinitionsObject, refs: string[]): JSONSchema4 {
    if (isSchemaRefObj(schema)) {
      if (!refs.includes(schema.$ref)) {
        // 找到ref的定义
        return this.dealWithRef(schema.$ref, defs, refs, '') ?? {};
      }
    } else {
      return {
        type: 'object',
        properties: this.generatePropertiesJSONSchema(schema.properties ?? {}, defs, refs),
      };
    }

    return {};
  }

  private generatePropertiesJSONSchema(
    properties: { [key: string]: OpenAPIV2.SchemaObject },
    defs: OpenAPIV2.DefinitionsObject,
    refs: string[],
    description = ''
  ): { [key: string]: JSONSchema4 } {
    const result: { [key: string]: JSONSchema4 } = {};
    for (const key of Object.keys(properties)) {
      // 只选中data和pager
      const property = properties[key];

      if (['errcode', 'errmsg'].includes(key)) {
        continue;
      }

      result[key] = this.generateJSonSchemaFromOpenAPISchema(property, defs, refs, description);
    }

    return result;
  }

  private dealWithRef(ref: string, defs: OpenAPIV2.DefinitionsObject, refs: string[], description?: string): JSONSchema4 | undefined {
    const elements = ref.split('/');
    const key = elements[elements.length - 1];

    if (key) {
      const schema = defs[key];
      if (schema) {
        refs.push(ref);

        return this.generateJSonSchemaFromOpenAPISchema(schema, defs, refs, description);
      }
    }

    return undefined;
  }

  /**
   * 转换响应
   * 需要处理的是循环的情况，所有ref是需要处理的
   * @private
   * @param {OpenAPIV2.Response} response
   * @param {OpenAPIV2.DefinitionsObject} defs
   * @param {string[]} refs
   * @returns {({ [k: string]: JSONSchema4 } | undefined)}
   * @memberof GenerateResponseDataSchemaFlowUnit
   */
  private convertResponse(response: OpenAPIV2.Response, defs: OpenAPIV2.DefinitionsObject, refs: string[]): JSONSchema4 {
    if (isResponseRefObj(response)) {
      if (!refs.includes(response.$ref)) {
        // 找到ref的定义
        return this.dealWithRef(response.$ref, defs, refs, '') ?? {};
      }
    } else if (response.schema) {
      return this.generateSchema(response.schema, defs, refs);
    }

    return {};
  }

  private findDataSchemaFromRef(
    ref: string,
    defs: OpenAPIV2.DefinitionsObject
  ): {
    data: OpenAPIV2.SchemaObject;
    isPageList: boolean;
  } {
    if (!ref.startsWith('#')) {
      // 暂时不支持外链
      throw Error('暂时还不支持ref是绝对路径');
    }

    const elements = ref.split('/');
    const key = elements[elements.length - 1];

    if (key) {
      const schema = defs[key];
      return this.findDataSchemeFromSchemaObject(schema, defs);
    }

    return {
      data: {},
      isPageList: false,
    };
  }

  private findDataSchemeFromSchema(
    obj: OpenAPIV2.Schema,
    defs: OpenAPIV2.DefinitionsObject
  ): {
    data: OpenAPIV2.SchemaObject;
    isPageList: boolean;
  } {
    if (isSchemaRefObj(obj)) {
      return this.findDataSchemaFromRef(obj.$ref, defs);
    } else {
      return this.findDataSchemeFromSchemaObject(obj, defs);
    }
  }

  private findDataSchemeFromSchemaObject(
    schemaObj: OpenAPIV2.SchemaObject,
    defs: OpenAPIV2.DefinitionsObject
  ): {
    data: OpenAPIV2.SchemaObject;
    isPageList: boolean;
  } {
    if (schemaObj.$ref) {
      return this.findDataSchemaFromRef(schemaObj.$ref, defs);
    }

    let isPageList = false;
    let schema: OpenAPIV2.SchemaObject | undefined = undefined;
    // 我们只考虑perperties
    for (const key of Object.keys(schemaObj.properties ?? {})) {
      if (key === 'pager') {
        isPageList = true;
      }

      if (key === 'data') {
        schema = (schemaObj.properties ?? {})['data'];
      }
    }

    return {
      data: schema ? schema : {},
      isPageList: isPageList,
    };
  }

  /**
   * 找到响应的数据定义
   * @private
   * @param {OpenAPIV2.Response} response
   * @returns {{
   *     data: OpenAPIV2.SchemaObject;
   *     isPageList: boolean;
   *   }}
   * @memberof GenerateResponseDataSchemaFlowUnit
   */
  private findResponseData(
    response: OpenAPIV2.Response,
    defs: OpenAPIV2.DefinitionsObject
  ): {
    data: OpenAPIV2.SchemaObject;
    isPageList: boolean;
  } {
    if (isResponseRefObj(response)) {
      return this.findDataSchemaFromRef(response.$ref, defs);
    } else if (response.schema) {
      return this.findDataSchemeFromSchema(response.schema, defs);
    } else {
      return {
        data: {},
        isPageList: false,
      };
    }
  }

  async doWork(operationObj: OpenAPIV2.Document): Promise<IGenerateResponseDataSchemaFlowUnitResult> {
    const path = this.findRequestInPath(operationObj);
    if (!path) {
      throw Error('没有找到请求path');
    }

    // 找到response
    const response = this.findSucceedResponse(path);
    if (!response) {
      throw Error('没有找到成功的响应');
    }

    // 我们只要找到data对应的schema
    const refs: string[] = [];

    const dataInfo = this.findResponseData(response, operationObj.definitions ?? {});

    // const result = this.convertResponse(response, operationObj.definitions ?? {}, refs);
    return {
      isPageList: dataInfo.isPageList,
      dataSchema: this.generateJSonSchemaFromOpenAPISchema(dataInfo.data, operationObj.definitions ?? {}, refs),
    };
  }
}
