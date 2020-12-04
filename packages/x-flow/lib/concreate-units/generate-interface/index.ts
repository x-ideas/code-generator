/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * @name:
 * description:
 *  后台interface生成的处理逻辑
 */

import { InputData, JSONSchemaInput, quicktype, TypeScriptTargetLanguage } from 'quicktype-core';
import { JSONSchema4 } from 'json-schema';
import jscodeshift from 'jscodeshift';

import lodash from 'lodash';
import { XFlowUnit } from '../../flow-unit';
import { parserConfig } from '../../utils/jscodeshift-parser';

type TOption = {
  nicePropertyName: boolean;
  fInterfacePrefix?: string;
  bInterfacePrefix?: string;
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

  /**
   *
   * @param params topName不带IF,由nicePropertyName去添加
   */
  async doWork(params: { jsonSchema: JSONSchema4; topName: string }): Promise<string> {
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

    const prefix = this.#options.nicePropertyName ? this.#options.fInterfacePrefix ?? 'IF' : this.#options.bInterfacePrefix ?? 'IB';

    const replace1 = jscodeshift(lines.join('\n'), {
      parser: parserConfig(),
    })
      .find(jscodeshift.TSInterfaceDeclaration)
      .forEach(path => {
        //

        if (jscodeshift.Identifier.check(path.node.id)) {
          path.node.id.name = `${prefix}${path.node.id.name}`;
        }
      })
      .toSource();

    const replace2 = jscodeshift(replace1, {
      parser: parserConfig(),
    })
      .find(jscodeshift.TSTypeReference)
      .forEach(path => {
        //

        if (jscodeshift.Identifier.check(path.node.typeName)) {
          path.node.typeName.name = `${prefix}${path.node.typeName.name}`;
        }
      })
      .toSource();

    if (this.#options.nicePropertyName) {
      return replace2;
    } else {
      return replace2.replace(/export/g, '');
    }
  }
}
