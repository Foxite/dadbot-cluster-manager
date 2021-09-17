const __Schema = require('../../config/schema.json');
const Schema: any = __Schema;

type CoolJSON = { [key: string | number]: string | CoolJSON };

export enum ValidSchemaTypes {
  'string',
  'boolean',
  'number',
  'bigint'
}

export async function validate() {
  if (Array.isArray(Schema))
    throw new Error('Schema.json cannot have an array as root structure.');

  Object.values(Schema).forEach(a => {
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
  return Object.entries(data).every(a => {
    if (typeof a[1] === 'object') {
      if (Array.isArray(a[1])) {
        return a[1].every(aa => Schema[aa[0]].includes(typeof aa[1]));
      } else {
        return Object.entries(a[1]).every(aa => {
          if (
            Object.keys(Schema[a[0]]).includes(aa[0]) &&
            Object.values(Schema[a[0]]).includes(typeof aa[1])
          )
            return true;
          else return false;
        });
      }
    }
    if (typeof a[1] !== Schema[a[0]] || !Schema[a[0]]) return false;
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

export default {
  validate,
  validateData
};
