/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * @name:
 * description:
 *  将interface生成前端class定义的FlowUnit
 */

import * as babelParser from '@babel/parser';
import lodash from 'lodash';

import { XFlowUnit } from '../../flow-unit';

import jscodeshift from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';
import * as K from 'jscodeshift/node_modules/ast-types/gen/kinds';
import { parserConfig } from '../../utils/jscodeshift-parser';

export class GenerateClassFlowUnit extends XFlowUnit {
  #convertedFromNiceFormat: boolean;
  constructor({ convertedFromNiceFormat = true }: { convertedFromNiceFormat: boolean }) {
    super();

    this.#convertedFromNiceFormat = convertedFromNiceFormat;
  }

  /**
   *
   * @private
   * @param {Collection<jscodeshift.>} collection
   * @returns {Collection<ASTNode>}
   * @memberof GenerateClassFlowUnit
   */
  private _changeInterfaceToClass(collection: Collection<jscodeshift.ASTNode>): Collection<jscodeshift.ASTNode> {
    const newCollection = jscodeshift('');
    const newProgram = newCollection.find(jscodeshift.Program);

    collection.find(jscodeshift.TSInterfaceDeclaration).forEach(path => {
      const classDeclaration = generateClassDeclaration(path, {
        convertedFromNiceFormat: this.#convertedFromNiceFormat,
      });
      newProgram.get('body').value.push(classDeclaration);
    });

    return newCollection;
  }

  async doWork(interfaceSources: string): Promise<string> {
    const collection: Collection<jscodeshift.ASTNode> = jscodeshift(interfaceSources, {
      parser: parserConfig(),
    });
    // const a = collection.find(jscodeshift.TSInterfaceDeclaration).get('body').get('body');
    // // console.log(collection.find(jscodeshift.TSInterfaceDeclaration).length);

    // // const ds = collection.find(jscodeshift.TSInterfaceDeclaration);
    // // const id = ds.get('id');
    // console.log(collection.find(jscodeshift.TSInterfaceDeclaration).get('id').get('name').value);

    return this._changeInterfaceToClass(collection).toSource();
  }
}

/**
 * 生成exporse装饰器
 * @param {jscodeshift.TSPropertySignature} property
 * @returns {jscodeshift.Decorator}
 */
function generateExposeDecorator(
  property: jscodeshift.TSPropertySignature,
  options: {
    convertedFromNiceFormat: boolean;
  }
): jscodeshift.Decorator {
  // 找到参数
  const argums: jscodeshift.ObjectExpression[] = [];
  if (jscodeshift.Identifier.check(property.key)) {
    // property

    const bName: string = options.convertedFromNiceFormat ? lodash.snakeCase(property.key.name) : property.key.name;

    const nameProperty = jscodeshift.property('init', jscodeshift.identifier('name'), jscodeshift.literal(bName));
    argums.push(jscodeshift.objectExpression([nameProperty]));
  }

  return jscodeshift.decorator(jscodeshift.callExpression(jscodeshift.identifier('Expose'), argums));
}

/**
 * 生成validate装饰器
 * TODO: 判断是否是可选的属性
 * @param {jscodeshift.TSPropertySignature} property
 * @returns {jscodeshift.Decorator}
 */
function generateValidateDecorator(property: jscodeshift.TSPropertySignature): jscodeshift.Decorator | null {
  // let name: string = '';
  // if (jscodeshift.Identifier.check(property.key)) {
  //   name = property.key.name;
  // }

  // if (!name) {
  //   return null;
  // }

  if (property.optional) {
    return null;
  }

  if (property.typeAnnotation && jscodeshift.TSTypeAnnotation.check(property.typeAnnotation)) {
    // TODO: 根据类型和name生成对应的call expression

    switch (property.typeAnnotation.typeAnnotation.type) {
      // number, enum当作number
      case 'TSNumberKeyword': {
        return jscodeshift.decorator(
          jscodeshift.callExpression(jscodeshift.identifier('ValidateValue'), [
            jscodeshift.callExpression(
              jscodeshift.identifier.from({
                comments: [jscodeshift.commentBlock('NOTE: 判断为number的属性可能为枚举，如果为枚举，请手动增加一个枚举定义并替换该属性的类型')],
                name: 'getDefaultValidNum',
              }),
              []
            ),
          ])
        );

        break;
      }

      case 'TSStringKeyword': {
        // 判断是否为id // string;
        return jscodeshift.decorator(
          jscodeshift.callExpression(jscodeshift.identifier('ValidateValue'), [
            jscodeshift.callExpression(jscodeshift.identifier('getDefaultValidStr'), []),
          ])
        );
      }

      case 'TSBooleanKeyword':
        // boolean
        return jscodeshift.decorator(
          jscodeshift.callExpression(jscodeshift.identifier('ValidateValue'), [
            jscodeshift.callExpression(jscodeshift.identifier('getDefaultValidBoolean'), []),
          ])
        );

      case 'TSTypeReference':
        // 另一个类型定义(interface, class, enum),
        // NOTE: 通过前缀区分
        return jscodeshift.decorator(
          jscodeshift.callExpression(jscodeshift.identifier('Type'), [
            // @ts-ignore
            jscodeshift.arrowFunctionExpression([], jscodeshift.identifier(property.typeAnnotation.typeAnnotation.typeName?.name)),
          ])
        );

      case 'TSArrayType':
        {
          if (property.typeAnnotation.typeAnnotation.elementType.type === 'TSTypeReference') {
            const typeName = property.typeAnnotation.typeAnnotation.elementType.typeName;
            if (jscodeshift.Identifier.check(typeName)) {
              return jscodeshift.decorator(
                jscodeshift.callExpression(jscodeshift.identifier('Type'), [
                  jscodeshift.arrowFunctionExpression([], jscodeshift.identifier(typeName.name)),
                ])
              );
            }
          }
        }

        break;

      default:
        break;
    }
  }

  return null;
}

/**
 * 生成class property的初始化值
 * @param {jscodeshift.TSPropertySignature} property
 */
function generateClassPropertyInitValue(property: jscodeshift.TSPropertySignature): K.ExpressionKind | null {
  // 找到type类型
  const optional = property.optional;
  if (optional) {
    return null;
  }

  switch (property.typeAnnotation?.typeAnnotation.type) {
    case 'TSBooleanKeyword':
      return jscodeshift.literal(false);

    case 'TSNumberKeyword':
      return jscodeshift.literal(0);

    case 'TSStringKeyword': {
      // 是否是id
      jscodeshift.Identifier.assert(property.key);
      if (jscodeshift.Identifier.check(property.key)) {
        if (property.key.name.includes('id')) {
          return jscodeshift.callExpression(jscodeshift.identifier('getFrontId'), []);
        }
      }

      return jscodeshift.stringLiteral('');
    }

    case 'TSArrayType':
      return jscodeshift.arrayExpression([]);

    case 'TSTypeReference': {
      // TODO: 根据名字去判断
      return null;
    }

    default:
      return null;
  }
}

/**
 * 生成class property的标注
 * 如果property是可选的，那么会得到一个联合类型
 * @param {jscodeshift.TSParameterProperty} property
 * @returns {TSTypeAnnotationKind}
 */
function generateClassPropertyAnnotation(property: jscodeshift.TSPropertySignature): jscodeshift.TSTypeAnnotation | undefined {
  function _generate(typeAnnotation: K.TSTypeKind | K.TSTypeAnnotationKind, optional = false): jscodeshift.TSTypeAnnotation | undefined {
    switch (typeAnnotation.type) {
      case 'TSBooleanKeyword': {
        return optional
          ? jscodeshift.tsTypeAnnotation(jscodeshift.tsUnionType([jscodeshift.tsBooleanKeyword(), jscodeshift.tsUndefinedKeyword()]))
          : jscodeshift.tsTypeAnnotation(jscodeshift.tsBooleanKeyword());
      }
      case 'TSNumberKeyword': {
        return optional
          ? jscodeshift.tsTypeAnnotation(jscodeshift.tsUnionType([jscodeshift.tsNumberKeyword(), jscodeshift.tsUndefinedKeyword()]))
          : jscodeshift.tsTypeAnnotation(jscodeshift.tsNumberKeyword());
      }
      case 'TSStringKeyword': {
        return optional
          ? jscodeshift.tsTypeAnnotation(jscodeshift.tsUnionType([jscodeshift.tsStringKeyword(), jscodeshift.tsUndefinedKeyword()]))
          : jscodeshift.tsTypeAnnotation(jscodeshift.tsStringKeyword());
      }

      case 'TSArrayType': {
        return optional
          ? jscodeshift.tsTypeAnnotation(
              jscodeshift.tsUnionType([jscodeshift.tsArrayType(typeAnnotation.elementType), jscodeshift.tsUndefinedKeyword()])
            )
          : jscodeshift.tsTypeAnnotation(jscodeshift.tsArrayType(typeAnnotation.elementType));
      }

      case 'TSTypeReference': {
        return optional
          ? jscodeshift.tsTypeAnnotation(
              jscodeshift.tsUnionType([jscodeshift.tsTypeReference(typeAnnotation.typeName), jscodeshift.tsUndefinedKeyword()])
            )
          : jscodeshift.tsTypeAnnotation(jscodeshift.tsTypeReference(typeAnnotation.typeName));
      }
    }
    return undefined;
  }

  if (property.typeAnnotation) {
    switch (property.typeAnnotation.type) {
      case 'TSTypeAnnotation': {
        return _generate(property.typeAnnotation.typeAnnotation, property.optional);
        break;
      }

      default:
        break;
    }
  }

  return undefined;
}

/**
 * 生成class的属性定义
 * @param {jscodeshift.TSPropertySignature} property
 * @returns {(jscodeshift.ClassProperty | undefined)}
 */
function generateClassPropertyFromInterfaceProperty(
  property: jscodeshift.TSPropertySignature,
  options: {
    convertedFromNiceFormat: boolean;
  }
): jscodeshift.ClassProperty | null {
  if (jscodeshift.Identifier.check(property.key)) {
    const ccName = lodash.camelCase(property.key.name);

    const value = generateClassPropertyInitValue(property);
    const typeAnnotation = generateClassPropertyAnnotation(property);
    const cProperty = jscodeshift.classProperty(jscodeshift.identifier(ccName), value, typeAnnotation);
    cProperty.comments = property.comments;

    // @ts-ignore
    // NOTE: 定义居然没有
    cProperty.decorators = [generateExposeDecorator(property, options), generateValidateDecorator(property)].filter(Boolean);

    return cProperty;
  }
  return null;
}

/**
 * 生成class声明
 * @param {string} className
 * @param {jscodeshift.TSPropertySignature[]} properties
 * @returns {jscodeshift.ExportNamedDeclaration}
 */
function generateClassDeclaration(
  interfaceDeclaration: jscodeshift.ASTPath<jscodeshift.TSInterfaceDeclaration>,
  options: {
    convertedFromNiceFormat: boolean;
  }
): jscodeshift.ExportNamedDeclaration {
  const interfaceName: string = jscodeshift(interfaceDeclaration).get('id', 'name').value;
  const properties = jscodeshift(interfaceDeclaration).get('body', 'body').value;

  // @ts-ignore
  const cProperties = properties.map(prop => generateClassPropertyFromInterfaceProperty(prop, options));

  // 将第一个I替换成C
  return jscodeshift.exportNamedDeclaration(
    jscodeshift.classDeclaration(jscodeshift.identifier(`C${interfaceName.slice(1)}`), jscodeshift.classBody(cProperties))
  );
}
