import { OpenAPIV2 } from 'openapi-types';
import fetch from 'cross-fetch';
/*
 * @name:
 * description:
 *  获取swagger文档的unit
 */

import { XFlowUnit } from '../../flow-unit';

export class RequestSwaggerFlowUnit extends XFlowUnit {
  async doWork(swaggerUrl: string): Promise<OpenAPIV2.Document> {
    const res = await fetch(swaggerUrl);

    if (res.status >= 400) {
      throw new Error('swagger文档获取失败');
    }

    return await res.json();
  }
}
