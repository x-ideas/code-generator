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

  async doWork(jsonSchema: JSONSchema4): Promise<string> {
    const inputData = new InputData();

    // TODO: 名字
    const source = { name: 'IGenerated', schema: JSON.stringify(jsonSchema) };
    inputData.addSource('schema', source, () => new JSONSchemaInput(undefined));

    const { lines } = await quicktype({
      lang: new TypeScriptTargetLanguage(),
      inputData,

      // leadingComments: ['测试备注'],
      rendererOptions: {
        'just-types': 'true',
        'nice-property-names': this.#options.nicePropertyName ? 'true' : 'false',
      },
    });

    return lines.join('\n');
  }
}
