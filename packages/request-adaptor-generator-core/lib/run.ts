#!/usr/bin/env -S node -r "ts-node/register"
/* eslint-disable max-classes-per-file */
// 不需要ts-node全局安装

/* eslint-disable class-methods-use-this */

import * as fs from 'fs';
import path from 'path';

import debug from 'debug';
import {
  quicktype,
  InputData,
  JSONSchemaInput,
  CSharpTargetLanguage,
  CSharpRenderer,
  Type,
  Sourcelike,
  ClassType,
  RenderContext,
  getOptionValues,
  cSharpOptions,
  TypeAttributeKind,
  JSONSchema,
  Ref,
  JSONSchemaType,
  JSONSchemaAttributes,
  jsonInputForTargetLanguage,
  TargetLanguage,
} from 'quicktype-core';

const Log = debug('Log');

class GameCSharpRenderer extends CSharpRenderer {
  // We override the "superclassForType" method to make "GameObject" the superclass of all
  // class types.  We need to do the check for "ClassType" because quicktype also generates
  // classes for union types which we don't want to customize.
  protected superclassForType(t: Type): Sourcelike | undefined {
    if (t instanceof ClassType) {
      return 'GameObject';
    }
    return undefined;
  }
}

class GameCSharpTargetLanguage extends CSharpTargetLanguage {
  constructor() {
    // In the constructor we call the super constructor with fixed display name,
    // names, and extension, so we don't have to do it when instantiating the class.
    // Our class is not meant to be extensible in turn, so that's okay.
    super('C#', ['csharp'], 'cs');
  }

  // "makeRenderer" instantiates our "GameCSharpRenderer".  "cSharpOptions" are the
  // values for the customization options for C#, and "getOptionValues" translates the
  // untyped string values to the typed values that the renderer likes.
  protected makeRenderer(renderContext: RenderContext, untypedOptionValues: { [name: string]: any }): CSharpRenderer {
    return new GameCSharpRenderer(this, renderContext, getOptionValues(cSharpOptions, untypedOptionValues));
  }
}

async function main(program: string, args: string[]): Promise<void> {
  // Exactly one command line argument allowed, the name of the JSON Schema file.
  if (args.length !== 1) {
    Log(`Usage: ${program} SCHEMA`);
    process.exit(1);
  }

  // The "InputData" holds all the sources of type information that we give to quicktype.
  const inputData = new InputData();

  const source = { name: 'Player', schema: fs.readFileSync(args[0], 'utf8') };
  // "JSONSchemaInput" is the class that reads JSON Schema and converts it into quicktype's
  // internal type representation (see https://blog.quicktype.io/under-the-hood/ for a
  // semi-outdated but still useful introduction to the IR).
  // The "source" object is in the form that "JSONSchemaInput" needs.
  await inputData.addSource('schema', source, () => new JSONSchemaInput(undefined));

  // "CSharpTargetLanguage" is the class for basic C# types.  Its subclass
  // "NewtonsoftCSharpTargetLanguage" also produces attributes for Newtonsoft's Json.NET,
  // but we don't need those for our game, so we work with the base class directly.
  // Because it's not specialized we have to give it three arguments, none of which are
  // actually needed in our simple application: The "display name" of the language, an
  // array of names by which we could specify it, were we using quicktype's CLI, and the
  // file extension for the language.
  // const lang = new CSharpTargetLanguage('C#', ['csharp'], 'cs');
  const lang = new CSharpTargetLanguage('C#', ['csharp'], 'cs');

  // What we get back from running "quicktype" is the source code as an array of lines.
  const { lines } = await quicktype({ lang, inputData });

  for (const line of lines) {
    Log(line);
  }
}

const jsonObj = {
  greeting: 'Welcome to quicktype!',
  instructions: [
    'Type or paste JSON here',
    'Or choose a sample above',
    'quicktype will generate code in your',
    'chosen language to parse the sample data',
  ],
};
main(JSON.stringify(jsonObj), [path.resolve(__dirname, './schema.json')]);
