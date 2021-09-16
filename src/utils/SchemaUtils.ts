import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

type CoolJSON = { [key: string | number]: string | CoolJSON };

export enum ValidSchemaTypes {
  'string',
  'boolean',
  'number',
  'bigint'
}

async function readSchema() {
  let fileContents;
  try {
    let strContents = await readFile('config/schema.json', {
      encoding: 'utf-8'
    });
    fileContents = JSON.parse(strContents);
  } catch (err) {
    throw new Error('Unable to access schema.json');
  }

  return fileContents;
}

export async function validate() {
  try {
    access('config/schema.json', constants.R_OK);
  } catch (err) {
    throw new Error('Unable to access schema.json');
  }

  let fileContents;
  try {
    fileContents = await readSchema();
  } catch (err) {
    throw new Error('Unable to access schema.json');
  }

  if (Array.isArray(fileContents))
    throw new Error('Schema.json cannot have an array as root structure.');

  Object.values(fileContents).forEach(a => {
    if (getDataType(a) === null) throw new Error('Schema.json is invalid.');
    if (getDataType(a) === undefined)
      if (!recursiveValidate(a as CoolJSON))
        throw new Error('Schema.json is invalid.');
  });
}

function recursiveValidate(
  val: CoolJSON | Array<string | boolean | bigint | CoolJSON>
): boolean {
  if (Array.isArray(val)) {
    if (
      val.every(a => {
        if (getDataType(a) === null) return false;
        if (getDataType(a) === undefined)
          return recursiveValidate(a as CoolJSON);
        return true;
      })
    ) {
      return true;
    } else return false;
  } else {
    return Object.entries(val).every(a => {
      if (!(typeof a[0] === 'number' || typeof a[0] === 'string')) return false;
      if (getDataType(a[1]) === null) return false;
      if (getDataType(a[1]) === undefined)
        return recursiveValidate(a[1] as CoolJSON);
      return true;
    });
  }
}

export async function validateData(data: any) {
  let schema = await readSchema();
  return Object.entries(data).every(a => {
    if (typeof a[1] === 'object') {
      if (Array.isArray(a[1])) {
        return a[1].every(aa => schema[aa[0]].includes(typeof aa[1]));
      } else {
        return Object.entries(a[1]).every(aa => {
          if (
            Object.keys(schema[a[0]]).includes(aa[0]) &&
            Object.values(schema[a[0]]).includes(typeof aa[1])
          )
            return true;
          else return false;
        });
      }
    }
    if (typeof a[1] !== schema[a[0]]) return false;
    else return true;
  });
}

function getDataType(a: any): ValidSchemaTypes {
  if (typeof a === 'object') return undefined;
  switch (a as string) {
    case 'bigint':
      return ValidSchemaTypes.bigint;
    case 'boolean':
      return ValidSchemaTypes.boolean;
    case 'number':
      return ValidSchemaTypes.number;
    case 'string':
      return ValidSchemaTypes.string;
    default:
      return null;
  }
}
