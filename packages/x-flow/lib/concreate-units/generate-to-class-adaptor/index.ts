/*
 * @name:
 * description:
 *  生成class的适配函数
 */
import jscodeshift from 'jscodeshift';

import { XFlowUnit } from '../../flow-unit';

export class GenerateToClassAdaptorFlowUnit extends XFlowUnit {
  private generateFunc(className: string) {
    const funcDeclaration = jscodeshift.functionDeclaration(
      jscodeshift.identifier(`to${className}AdaptorFunc`),
      [
        jscodeshift.identifier.from({
          name: 'bInfo',
          comments: [],
          typeAnnotation: jscodeshift.typeAnnotation(jscodeshift.anyTypeAnnotation()),
        }),
      ],
      jscodeshift.blockStatement([
        jscodeshift.returnStatement(
          jscodeshift.callExpression(
            jscodeshift.memberExpression(
              jscodeshift.callExpression(jscodeshift.identifier('plainToClass'), [
                jscodeshift.identifier(className),
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
              ]),
              jscodeshift.identifier('filter')
            ),
            [
              jscodeshift.arrowFunctionExpression(
                [jscodeshift.identifier('item')],
                jscodeshift.callExpression(jscodeshift.memberExpression(jscodeshift.identifier('item'), jscodeshift.identifier('isValid')), [])
              ),
            ]
          )
        ),
      ])
    );

    // funcDeclaration.returnType = jscodeshift.typeAnnotation(jscodeshift.iterface(jscodeshift.identifier('dd')));
    return funcDeclaration;
  }

  async doWork(className: string) {
    const program = jscodeshift('').find(jscodeshift.Program);
    program.get('body').value.push(this.generateFunc(className));

    return {
      funcName: `to${className}AdaptorFunc`,
      func: program.toSource(),
    };
  }
}
