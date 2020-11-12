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
  async doWork(openApi: OpenAPI.Document): Promise<OpenAPI.Document> {
    const parser = new SwaggerParser();

    const api = await parser.validate(openApi);
    return api;
  }
}
