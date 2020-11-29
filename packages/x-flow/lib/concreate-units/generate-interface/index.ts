/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * @name:
 * description:
 *  后台interface生成的处理逻辑
 */

import { InputData, JSONSchemaInput, quicktype, TypeScriptTargetLanguage } from 'quicktype-core';
import { JSONSchema4 } from 'json-schema';
import { XFlowUnit } from '../../flow-unit';

type TOption = {
  nicePropertyName: boolean;
};

/**
 * 将json scheme生成interface的处理流程
 * @export
 * @class BackEndInterfaceGenerateFlowUnit
 * @extends {XFlowUnit}
 */
export class InterfaceGenerateFlowUnit extends XFlowUnit {
  #options: TOption;

  constructor(options: TOption) {
    super();

    this.#options = options;
  }

  async doWork(params: { jsonSchema: JSONSchema4; topName: string }): Promise<string[]> {
    const inputData = new InputData();

    const source = { name: params.topName, schema: JSON.stringify(params.jsonSchema) };
    inputData.addSource('schema', source, () => new JSONSchemaInput(undefined));

    const { lines } = await quicktype({
      lang: new TypeScriptTargetLanguage(),
      inputData,

      // leadingComments: ['测试备注'],
      rendererOptions: {
        'just-types': 'true',
        // @ts-ignore
        'nice-property-names': this.#options.nicePropertyName ? 'true' : '',
        'acronym-style': 'camel',
      },
    });

    return lines;
  }
}
