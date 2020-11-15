/*
 * @name:
 * description:
 *  将openAPI转换成JSON Schema的处理过程
 */

import { JSONSchema4 } from 'json-schema';
import { OpenAPIV2 } from 'openapi-types';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import toJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';

import { XFlowUnit } from '../../flow-unit';

export class ConvertOpenAPIToJsonSchemeFlowUnit extends XFlowUnit {
  async doWork(openApi: OpenAPIV2.Document): Promise<JSONSchema4> {
    return toJsonSchema(openApi);
  }
}
