import { XFlowUnit } from '../../../flow-unit';
import { OpenAPIV2 } from 'openapi-types';

let _response: Response;
export function setResponse(response: Response): void {
  _response = response;
}

export class RequestSwaggerFlowUnit extends XFlowUnit {
  constructor() {
    super();
  }

  async doWork(swaggerUrl: string): Promise<OpenAPIV2.Document> {
    if (_response.status >= 400) {
      throw new Error('swagger文档获取失败');
    }

    return _response.json();
  }
}
