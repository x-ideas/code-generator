import { XFlowUnit } from '../../flow-unit';

import * as babelParser from '@babel/parser';
import lodash from 'lodash';

import jscodeshift, { ASTPath } from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';

interface IGenerateInterfaceAdaptorOptions {
  fromType: string;
  from: string;

  toType: string;
  // to: string;

  isConvertedFromFront: boolean;
}

export class GenerateInterfaceAdaptor extends XFlowUnit {
  _getFuncName(name: string, options: IGenerateInterfaceAdaptorOptions) {
    return `to${options.isConvertedFromFront ? 'B' : 'F'}${name}Adaptor`;
  }

  _generateInterfaceAdaptor(
    objectName: string,
    options: IGenerateInterfaceAdaptorOptions,
    properties: jscodeshift.TSPropertySignature[]
  ): jscodeshift.Property[] {
    const result: jscodeshift.Property[] = [];

    for (const property of properties) {
      if (jscodeshift.Identifier.check(property.key)) {
        const name = property.key.name;

        let isRef = false;
        let typeName = '';
        let isArray = false;

        if (jscodeshift.TSTypeReference.check(property.typeAnnotation?.typeAnnotation)) {
          isRef = true;
          if (jscodeshift.Identifier.check(property.typeAnnotation?.typeAnnotation.typeName))
            typeName = property.typeAnnotation?.typeAnnotation.typeName.name ?? '';
        } else if (jscodeshift.TSArrayType.check(property.typeAnnotation?.typeAnnotation)) {
          isArray = true;

          if (jscodeshift.TSTypeReference.check(property.typeAnnotation?.typeAnnotation.elementType)) {
            isRef = true;
            if (jscodeshift.Identifier.check(property.typeAnnotation?.typeAnnotation.elementType.typeName))
              typeName = property.typeAnnotation?.typeAnnotation.elementType.typeName.name ?? '';
          }
        }

        const memberExpression = jscodeshift.memberExpression(jscodeshift.identifier(objectName), jscodeshift.identifier(name));
        result.push(
          jscodeshift.property(
            'init',
            jscodeshift.identifier(options.isConvertedFromFront ? lodash.snakeCase(name) : lodash.camelCase(name)),
            isArray
              ? isRef
                ? jscodeshift.callExpression(memberExpression, [
                    jscodeshift.arrowFunctionExpression(
                      [jscodeshift.identifier('item')],
                      jscodeshift.callExpression(jscodeshift.identifier(this._getFuncName(typeName, options)), [jscodeshift.identifier('item')])
                    ),
                  ])
                : memberExpression
              : isRef
              ? jscodeshift.callExpression(jscodeshift.identifier(this._getFuncName(typeName, options)), [memberExpression])
              : memberExpression
          )
        );
      }
    }

    return result;
  }

  async doWork(options: IGenerateInterfaceAdaptorOptions): Promise<string[]> {
    const collection: Collection<jscodeshift.ASTNode> = jscodeshift(options.from, {
      parser: {
        parse(source: string) {
          return babelParser.parse(source, {
            sourceType: 'module',
            // 支持typescript, jsx
            plugins: [
              'estree',
              'typescript',
              [
                'decorators',
                {
                  decoratorsBeforeExport: true,
                },
              ],
              'exportDefaultFrom',
              'classProperties',
              'classPrivateProperties',
            ],
          });
        },
      },
    });

    const funcStr: string[] = [];
    collection.find(jscodeshift.TSInterfaceDeclaration).forEach((path: ASTPath<jscodeshift.TSInterfaceDeclaration>) => {
      if (jscodeshift.Identifier.check(path.node.id)) {
        const interfaceName = path.node.id.name;

        const interfaceProperties: jscodeshift.TSPropertySignature[] = path.node.body.body as jscodeshift.TSPropertySignature[];

        const func = jscodeshift.functionDeclaration(
          jscodeshift.identifier(this._getFuncName(interfaceName, options)),
          [
            jscodeshift.identifier.from({
              name: options.isConvertedFromFront ? 'fInfo' : 'bInfo',
              typeAnnotation: jscodeshift.tsTypeAnnotation(jscodeshift.tsTypeReference(jscodeshift.identifier(options.fromType))),
            }),
          ],
          jscodeshift.blockStatement([])
        );
        func.returnType = jscodeshift.tsTypeAnnotation(jscodeshift.tsTypeReference(jscodeshift.identifier(options.toType)));

        const result: Collection<any> = jscodeshift(func);

        const functionBody = func.body.body;

        functionBody.push(
          jscodeshift.returnStatement(
            jscodeshift.objectExpression(
              this._generateInterfaceAdaptor(options.isConvertedFromFront ? 'fInfo' : 'bInfo', options, interfaceProperties)
            )
          )
        );

        funcStr.push(result.toSource());
      }
    });

    return funcStr;
  }
}
