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

  private generateSchema(schema: OpenAPIV2.Schema, defs: OpenAPIV2.DefinitionsObject, refs: string[]) {
    if (isSchemaRefObj(schema)) {
      if (!refs.includes(schema.$ref)) {
        // 找到ref的定义
        return this.dealWithRef(schema.$ref, defs, refs, '') ?? {};
      }
    } else {
      return {
        type: schema.type,
        properties: this.generatePropertiesJSONSchema(schema.properties ?? {}, defs, refs),
      };
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

  async doWork(operationObj: OpenAPIV2.Document): Promise<JSONSchema4> {
    const path = this.findRequestInPath(operationObj);
    if (!path) {
      throw Error('没有找到请求path');
    }

    // 找到response
    const response = this.findSucceedResponse(path);
    if (!response) {
      throw Error('没有找到成功的响应');
    }

    const refs: string[] = [];
    // const result: JSONSchema4 = {
    //   $schema: 'http://json-schema.org/draft-04/schema#',
    //   description: this.getDescription(path),
    //   ...this.convertResponse(response, operationObj.definitions ?? {}, refs),
    //   // required: [],
    //   // required: this.getRequeiredR((requestDef.parameters ?? []) as OpenAPIV2.Parameter[]),
    // };

    const result = this.convertResponse(response, operationObj.definitions ?? {}, refs);

    return result;
  }
}
