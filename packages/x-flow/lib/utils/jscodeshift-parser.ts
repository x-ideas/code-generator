import * as babelParser from '@babel/parser';

export function parserConfig() {
  return {
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
  };
}
