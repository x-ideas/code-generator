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

  private generateItemJsonSchema(items?: OpenAPIV2.ItemsObject): JSONSchema4 | JSONSchema4[] | undefined {
    if (items) {
      if (items.$ref) {
        // 不处理，因为之前我们已经使用了swagger
        throw Error('不能处理item.$ref，请提前使用swagger parse进行处理');
      }

      switch (items.type) {
        case 'array': {
          return {
            type: items.type,
            items: this.generateItemJsonSchema(items.items),
          };
        }

        case 'object': {
          // 此时ref被填充
          return {
            type: items.type,
            // @ts-ignore
            description: items.title ?? '',
            // @ts-ignore
            properties: this.generatePropertiesJSONSchema(items.properties ?? {}),
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

  private generateJSonSchemaFromOpenAPISchema(schema: OpenAPIV2.SchemaObject): JSONSchema4 {
    switch (schema.type) {
      case 'array': {
        const items = schema.items;
        return {
          type: schema.type,
          description: schema.description ?? schema.title,
          items: this.generateItemJsonSchema(items),
        };
      }

      case 'object': {
        return {
          type: schema.type,
          description: schema.description,
          properties: this.generatePropertiesJSONSchema(schema.properties ?? {}),
        };
      }

      case 'string':
      case 'number':
      case 'integer':
      case 'boolean':
        return {
          type: schema.type,
          description: schema.description,
          default: schema.default,
        };

      default:
        return {};
    }
  }

  private generatePropertiesJSONSchema(properties: { [key: string]: OpenAPIV2.SchemaObject }): { [key: string]: JSONSchema4 } {
    const result: { [key: string]: JSONSchema4 } = {};
    for (const key of Object.keys(properties)) {
      // 只选中data和pager
      const property = properties[key];

      result[key] = this.generateJSonSchemaFromOpenAPISchema(property);
    }

    return result;
  }

  private convertResponse(response: OpenAPIV2.Response): { [k: string]: JSONSchema4 } | undefined {
    if (isResponseRefObj(response)) {
      throw Error('目前不能处理带有ref的响应，请先用swagger parse flow unit处理一下swagger文档');
    }

    if (response.schema) {
      if (isSchemaRefObj(response.schema)) {
        throw Error('目前不能处理带有ref的响应，请先用swagger parse flow unit处理一下swagger文档');
      }

      if (response.schema.properties) {
        // 只选data和pager
        const keys = Object.keys(response.schema.properties);
        const result: { [name: string]: JSONSchema4 } = {};
        for (const key of keys) {
          if (['data', 'pager'].includes(key)) {
            result[key] = this.generateJSonSchemaFromOpenAPISchema(response.schema.properties[key]);
            // return this.generatePropertiesJSONSchema(response.schema.properties);
          }
        }

        return result;
      }
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

    const result: JSONSchema4 = {
      $schema: 'http://json-schema.org/draft-04/schema#',
      description: this.getDescription(path),
      type: 'object',
      properties: this.convertResponse(response),
      // required: this.getRequeiredParamers((requestDef.parameters ?? []) as OpenAPIV2.Parameter[]),
    };

    return result;
  }
}
