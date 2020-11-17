/*
 * @name:
 * description:
 *  将interface生成前端class定义的FlowUnit
 */

import * as recast from 'recast';
import * as babelParser from '@babel/parser';
import { XFlowUnit } from '../../flow-unit';
import { namedTypes, builders } from 'ast-types';

import jscodeshift, { ASTNode } from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';

export class GenerateClassFlowUnit extends XFlowUnit {
  private _changeInterfaceToClass(collection: Collection<ASTNode>): Collection<ASTNode> {
    collection.find(namedTypes.TSInterfaceDeclaration).forEach(path => {
      console.log(path);
      console.log(path.name);
    });

    return collection;
  }

  async doWork(interfaceSources: string[]): Promise<any> {
    const collection: Collection<ASTNode> = jscodeshift(interfaceSources.join('\n'), {
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

    // const node: ASTNode = recast.parse(interfaceSourceStr, {
    //   parser: {
    //     parse(source: string) {
    //       return babelParser.parse(source, {
    //         sourceType: 'module',
    //         // 支持typescript, jsx
    //         plugins: [
    //           'estree',
    //           'typescript',
    //           [
    //             'decorators',
    //             {
    //               decoratorsBeforeExport: true,
    //             },
    //           ],
    //           'exportDefaultFrom',
    //           'classProperties',
    //           'classPrivateProperties',
    //         ],
    //       });
    //     },
    //   },
    // });

    // console.log(node);

    //

    this._changeInterfaceToClass(collection);

    // return collection.toSource();
  }
}

function generateClassPropertyDecorator(property: namedTypes.TSPropertySignature): namedTypes.Decorator {
  builders.decorator(builders.callExpression(namedTypes.Identifier, []));
}

function generateClassPropertyFromInterfaceProperty(property: namedTypes.TSPropertySignature): namedTypes.ClassProperty {
  builders.classProperty();
}

function generateClassMethod() {
  //
}

function generateClassDeclaration() {
  //
}
