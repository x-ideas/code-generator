/*
 * @name:
 * description:
 *  生成class的适配函数
 */
import jscodeshift from 'jscodeshift';

import { XFlowUnit } from '../../flow-unit';

export class GenerateToClassAdaptorFlowUnit extends XFlowUnit {
  private _generateFunc(options: { className: string }) {
    const funcDeclaration = jscodeshift.functionDeclaration(
      jscodeshift.identifier(`to${options.className}AdaptorFunc`),
      [
        jscodeshift.identifier.from({
          name: `bInfo`,
          comments: [],
          typeAnnotation: jscodeshift.typeAnnotation(jscodeshift.anyTypeAnnotation()),
        }),
      ],
      jscodeshift.blockStatement([
        jscodeshift.variableDeclaration('const', [
          jscodeshift.variableDeclarator(
            jscodeshift.identifier('result'),
            jscodeshift.callExpression(jscodeshift.identifier('plainToClass'), [
              jscodeshift.identifier(options.className),
              jscodeshift.identifier('bInfo'),
              jscodeshift.objectExpression([
                jscodeshift.property('init', jscodeshift.identifier('excludeExtraneousValues'), jscodeshift.literal(true)),
                jscodeshift.property(
                  'init',
                  jscodeshift.identifier('groups'),
                  jscodeshift.arrayExpression([
                    jscodeshift.memberExpression(jscodeshift.identifier('EExportGroup'), jscodeshift.identifier('Always')),
                  ])
                ),
              ]),
            ])
          ),
        ]),
        jscodeshift.ifStatement(
          jscodeshift.callExpression(jscodeshift.memberExpression(jscodeshift.identifier('result'), jscodeshift.identifier('isValid')), []),
          jscodeshift.blockStatement([jscodeshift.returnStatement(jscodeshift.identifier('result'))]),
          jscodeshift.blockStatement([
            jscodeshift.throwStatement(
              jscodeshift.newExpression(jscodeshift.identifier('Error'), [
                jscodeshift.templateLiteral(
                  [
                    jscodeshift.templateElement(
                      {
                        cooked: '无效的数据',
                        raw: '无效的数据',
                      },
                      true
                    ),
                  ],
                  []
                ),
              ])
            ),
          ])
        ),
      ])
    );

    [
      jscodeshift.arrowFunctionExpression(
        [jscodeshift.identifier('item')],
        jscodeshift.callExpression(jscodeshift.memberExpression(jscodeshift.identifier('item'), jscodeshift.identifier('isValid')), [])
      ),
    ];

    // funcDeclaration.returnType = jscodeshift.typeAnnotation(jscodeshift.iterface(jscodeshift.identifier('dd')));
    return funcDeclaration;
  }

  private _generateArrayFunc(options: { className: string }) {
    const funcDeclaration = jscodeshift.functionDeclaration(
      jscodeshift.identifier(`to${options.className}AdaptorFunc`),
      [
        jscodeshift.identifier.from({
          name: `bInfo`,
          comments: [],
          typeAnnotation: jscodeshift.tsTypeAnnotation(jscodeshift.tsArrayType(jscodeshift.tsAnyKeyword())),
        }),
      ],
      jscodeshift.blockStatement([
        jscodeshift.variableDeclaration('const', [
          jscodeshift.variableDeclarator(
            jscodeshift.identifier('result'),
            jscodeshift.callExpression(jscodeshift.identifier('plainToClass'), [
              jscodeshift.identifier(options.className),
              jscodeshift.identifier('bInfo'),
              jscodeshift.objectExpression([
                jscodeshift.property('init', jscodeshift.identifier('excludeExtraneousValues'), jscodeshift.literal(true)),
                jscodeshift.property(
                  'init',
                  jscodeshift.identifier('groups'),
                  jscodeshift.arrayExpression([
                    jscodeshift.memberExpression(jscodeshift.identifier('EExportGroup'), jscodeshift.identifier('Always')),
                  ])
                ),
              ]),
            ])
          ),
        ]),
        jscodeshift.returnStatement(
          jscodeshift.callExpression(jscodeshift.memberExpression(jscodeshift.identifier('result'), jscodeshift.identifier('filter')), [
            jscodeshift.arrowFunctionExpression(
              [jscodeshift.identifier('item')],
              jscodeshift.callExpression(jscodeshift.memberExpression(jscodeshift.identifier('item'), jscodeshift.identifier('isValid')), [])
            ),
          ])
        ),
      ])
    );

    [
      jscodeshift.arrowFunctionExpression(
        [jscodeshift.identifier('item')],
        jscodeshift.callExpression(jscodeshift.memberExpression(jscodeshift.identifier('item'), jscodeshift.identifier('isValid')), [])
      ),
    ];

    // funcDeclaration.returnType = jscodeshift.typeAnnotation(jscodeshift.iterface(jscodeshift.identifier('dd')));
    return funcDeclaration;
  }

  private generateFunc(options: { className: string; isArray: boolean }) {
    if (options.isArray) {
      return this._generateArrayFunc({ className: options.className });
    } else {
      return this._generateFunc({ className: options.className });
    }
  }

  async doWork(options: { className: string; isArray: boolean }) {
    const program = jscodeshift('').find(jscodeshift.Program);
    program.get('body').value.push(this.generateFunc(options));

    return {
      funcName: `to${options.className}AdaptorFunc`,
      func: program.toSource(),
    };
  }
}
