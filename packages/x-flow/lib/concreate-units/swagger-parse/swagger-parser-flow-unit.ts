import { OpenAPIV2 } from 'openapi-types';
/*
 * @name:
 * description:
 *  解析swagger文档，
 * * 解析所有的$ref
 */

import { OpenAPI } from 'openapi-types';
import SwaggerParser from '@apidevtools/swagger-parser';

import { XFlowUnit } from '../../flow-unit';

export class SwaggerParseFlowUnit extends XFlowUnit {
  async doWork(openApi: OpenAPI.Document): Promise<OpenAPIV2.Document> {
    const parser = new SwaggerParser();

    const api = await parser.validate(openApi, {
      dereference: {
        // 对于循环的ref，不处理
        circular: 'ignore',
      },
    });
    // NOTE: 我们这里只处理v2
    return api as OpenAPIV2.Document;
  }
}
