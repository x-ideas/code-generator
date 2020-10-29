#!/usr/bin/env -S node -r "ts-node/register"
/* eslint-disable max-classes-per-file */
// 不需要ts-node全局安装

/* eslint-disable class-methods-use-this */

import * as fs from 'fs';
import * as path from 'path';

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
  TypeScriptTargetLanguage,
} from 'quicktype-core';

const Log = debug('Log');

class GameObjectTypeAttributeKind extends TypeAttributeKind<boolean> {
  constructor() {
    // This name is only used for debugging purposes.
    super('gameObject');
  }

  // When two or more classes are combined, such as in a "oneOf" schema, the
  // resulting class is a game object if at least one of the constituent
  // classes is a game object.
  combine(attrs: boolean[]): boolean {
    return attrs.some(x => x);
  }

  // Type attributes are made inferred in cases where the given type
  // participates in a union with other non-class types, for example.  In
  // those cases, the union type does not get the attribute at all.
  makeInferred(_: boolean): undefined {
    return undefined;
  }

  // For debugging purposes only.  It shows up when quicktype is run with
  // with the "debugPrintGraph" option.
  stringify(isGameObject: boolean): string {
    return isGameObject.toString();
  }
}

const gameObjectTypeAttributeKind = new GameObjectTypeAttributeKind();

// "schema" is the JSON object in the schema for the type it's being applied to.
// In the case of our "Player" type, that would be the object at "definitions.Player"
// in the schema.

// "canonicalRef" is the location in the schema of that type.  We only use it in an
// error message here.

// "types" is a set of JSON type specifiers, such as "object", "string", or
// "boolean".  The reason it's a set and not just a single one is that one type
// within the schema can specify values of more than one JSON type.  For example,
// { "type": ["string", "boolean"] } is a JSON Schema for "all strings and all
// booleans".
function gameObjectAttributeProducer(
    schema: JSONSchema,
    canonicalRef: Ref,
    types: Set<JSONSchemaType>
): JSONSchemaAttributes | undefined {
    // Booleans are valid JSON Schemas, too: "true" means "all values allowed" and
    // "false" means "no values allowed".  In fact, the "false" for
    // additionalProperties in our schema is a case of the latter.  For that reason,
    // our producer could be called on a boolean, which we have to check for first.
    if (typeof schema !== "object") return undefined;

    // Next we check whether the type we're supposed to produce attributes for even
    // allows objects as values.  If it doesn't, it's not our business, so we
    // return "undefined".
    if (!types.has("object")) return undefined;

    // Now we can finally check whether our type is supposed to be a game object.
    let isGameObject: boolean;
    if (schema.gameObject === undefined) {
        // If it doesn't have the "gameObject" property, it isn't.
        isGameObject = false;
    } else if (typeof schema.gameObject === "boolean") {
        // If it does have it, we make sure it's a boolean and use its value.
        isGameObject = schema.gameObject;
    } else {
        // If it's not a boolean, we throw an exception to let the user know
        // what's what.
        throw new Error(`gameObject is not a boolean in ${canonicalRef}`);
    }

    // Lastly, we generate the type attribute and return it, which requires a bit of
    // ceremony.  A producer is allowed to return more than one type attribute, so to
    // know which attribute corresponds to which attribute kind, it needs to be wrapped
    // in a "Map", which is what "makeAttributes" does.  The "forType" specifies that
    // these attributes go on the actual types specified in the schema.  We won't go
    // into the other possibilities here.
    return { forType: gameObjectTypeAttributeKind.makeAttributes(isGameObject) };
}

class GameCSharpRenderer extends CSharpRenderer {
  // We override the "baseclassForType" method to make "GameObject" the superclass of all
  // class types.  We need to do the check for "ClassType" because quicktype also generates
  // classes for union types which we don't want to customize.
  protected baseclassForType(t: Type): Sourcelike | undefined {
    if (t instanceof ClassType) {
      // All the type's attributes
      const attributes = t.getAttributes();
      // The game object attribute, or "undefined"
      const isGameObject = gameObjectTypeAttributeKind.tryGetInAttributes(attributes);
      return isGameObject ? 'GameObject' : undefined;
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
  await inputData.addSource('schema', source, () => new JSONSchemaInput(undefined, [gameObjectAttributeProducer]));

  // "CSharpTargetLanguage" is the class for basic C# types.  Its subclass
  // "NewtonsoftCSharpTargetLanguage" also produces attributes for Newtonsoft's Json.NET,
  // but we don't need those for our game, so we work with the base class directly.
  // Because it's not specialized we have to give it three arguments, none of which are
  // actually needed in our simple application: The "display name" of the language, an
  // array of names by which we could specify it, were we using quicktype's CLI, and the
  // file extension for the language.
  // const lang = new CSharpTargetLanguage('C#', ['csharp'], 'cs');
  const lang = new GameCSharpTargetLanguage();

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
