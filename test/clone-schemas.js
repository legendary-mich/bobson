'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {
  Object_Schema,
  Array_Schema,
  String_Schema,
  Enum_Schema,
  Integer_Schema,
  BigInt_Schema,
  Decimal_Schema,
} = require('../lib/schemas.js')

describe('clone schemas', () => {
  it('Object_Schema', () => {
    const fields = new Map()
    const required_fields = []
    const base = new Object_Schema('old type', fields, required_fields)
    const clone = base.clone('new type')
    deepEq(clone instanceof Object_Schema, true)
    deepEq(clone.type, 'new type')
    deepEq(clone.fields, fields)
    deepEq(clone.required_fields, required_fields)
  })

  it('Array_Schema', () => {
    const min_length = 2
    const max_length = 3
    const child_schema = new Object_Schema('old type', new Map(), [])
    const base = new Array_Schema('arr', min_length, max_length, child_schema)
    const clone = base.clone('new type')
    deepEq(clone instanceof Array_Schema, true)
    deepEq(clone.type, 'new type')
    deepEq(clone.min_length, min_length)
    deepEq(clone.max_length, max_length)
    deepEq(clone.child_schema, child_schema)
  })

  it('String_Schema', () => {
    const min_length = 2
    const max_length = 3
    const regex = new RegExp()
    const base = new String_Schema('old type', min_length, max_length, regex)
    const clone = base.clone('new type')
    deepEq(clone instanceof String_Schema, true)
    deepEq(clone.type, 'new type')
    deepEq(clone.min_length, min_length)
    deepEq(clone.max_length, max_length)
    deepEq(clone.regex, regex)
  })

  it('Enum_Schema', () => {
    const enums = ['aba', 'bobo']
    const base = new Enum_Schema('old type', enums)
    const clone = base.clone('new type')
    deepEq(clone instanceof Enum_Schema, true)
    deepEq(clone.type, 'new type')
    deepEq(clone.enums, base.enums)
  })

  it('Integer_Schema', () => {
    const min = 2
    const max = 3
    const base = new Integer_Schema('old type', min, max)
    const clone = base.clone('new type')
    deepEq(clone instanceof Integer_Schema, true)
    deepEq(clone.type, 'new type')
    deepEq(clone.min, min)
    deepEq(clone.max, max)
  })

  it('BigInt_Schema', () => {
    const min = 2n
    const max = 3n
    const base = new BigInt_Schema('old type', min, max)
    const clone = base.clone('new type')
    deepEq(clone instanceof BigInt_Schema, true)
    deepEq(clone.type, 'new type')
    deepEq(clone.min, min)
    deepEq(clone.max, max)
  })

  it('Decimal_Schema', () => {
    const min = '2.22'
    const max = '3.33'
    const base = new Decimal_Schema('old type', min, max)
    const clone = base.clone('new type')
    deepEq(clone instanceof Decimal_Schema, true)
    deepEq(clone.type, 'new type')
    deepEq(clone.min.string, min)
    deepEq(clone.max.string, max)
    deepEq(clone.min, base.min)
    deepEq(clone.max, base.max)
  })
})
