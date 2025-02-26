'use strict'

const {deepStrictEqual: deepEq, ok, strictEqual: strictEq} = require('node:assert/strict')
const {
  Object_Schema,
  Array_Schema,
  String_Schema,
  Enum_Schema,
  Integer_Schema,
  Decimal_Schema,
} = require('../lib/schemas.js')

const old_mixin = {
  parser_fn: () => 1,
  serializer_fn: () => 1,
  comparer_fn: () => 1,
}

const new_mixin = {
  parser_fn: () => 1,
  serializer_fn: () => 1,
  comparer_fn: () => 1,
}

describe('clone schemas', () => {
  it('Object_Schema', () => {
    const fields = new Map()
    const required_fields = []
    const defaults = {}
    const base = new Object_Schema('old type', old_mixin, fields, required_fields, defaults)
    const clone = base.clone('new type', new_mixin)
    strictEq(clone instanceof Object_Schema, true)
    strictEq(clone.type, 'new type')
    strictEq(clone.fields, fields)
    strictEq(clone.required_fields, required_fields)
    strictEq(clone.defaults, defaults)

    ok(clone.parser_fn); ok(clone.serializer_fn)
    strictEq(clone.parser_fn, new_mixin.parser_fn)
    strictEq(clone.serializer_fn, new_mixin.serializer_fn)
  })

  it('Array_Schema', () => {
    const min_length = 2
    const max_length = 3
    const child_schema = new Object_Schema('old type', old_mixin, new Map(), [], {})
    const base = new Array_Schema('arr', old_mixin, min_length, max_length, child_schema)
    const clone = base.clone('new type', new_mixin)
    strictEq(clone instanceof Array_Schema, true)
    strictEq(clone.type, 'new type')
    strictEq(clone.min_length, min_length)
    strictEq(clone.max_length, max_length)
    strictEq(clone.child_schema, child_schema)

    ok(clone.parser_fn); ok(clone.serializer_fn)
    strictEq(clone.parser_fn, new_mixin.parser_fn)
    strictEq(clone.serializer_fn, new_mixin.serializer_fn)
  })

  it('String_Schema', () => {
    const min_length = 2
    const max_length = 3
    const regex = new RegExp()
    const base = new String_Schema('old type', old_mixin, min_length, max_length, regex)
    const clone = base.clone('new type', new_mixin)
    strictEq(clone instanceof String_Schema, true)
    strictEq(clone.type, 'new type')
    strictEq(clone.min_length, min_length)
    strictEq(clone.max_length, max_length)
    strictEq(clone.regex, regex)

    ok(clone.parser_fn); ok(clone.serializer_fn)
    strictEq(clone.parser_fn, new_mixin.parser_fn)
    strictEq(clone.serializer_fn, new_mixin.serializer_fn)
  })

  it('Enum_Schema', () => {
    const enums = ['aba', 'bobo']
    const base = new Enum_Schema('old type', old_mixin, enums)
    const clone = base.clone('new type', new_mixin)
    strictEq(clone instanceof Enum_Schema, true)
    strictEq(clone.type, 'new type')
    deepEq(clone.enums, base.enums)

    ok(clone.parser_fn); ok(clone.serializer_fn)
    strictEq(clone.parser_fn, new_mixin.parser_fn)
    strictEq(clone.serializer_fn, new_mixin.serializer_fn)
  })

  it('Integer_Schema', () => {
    const min = '2'
    const max = '3'
    const base = new Integer_Schema('old type', old_mixin, min, max)
    const clone = base.clone('new type', new_mixin)
    strictEq(clone instanceof Integer_Schema, true)
    strictEq(clone.type, 'new type')
    strictEq(clone.min_string, min)
    strictEq(clone.max_string, max)
    deepEq(clone.min, base.min)
    deepEq(clone.max, base.max)

    ok(clone.parser_fn); ok(clone.serializer_fn)
    strictEq(clone.parser_fn, new_mixin.parser_fn)
    strictEq(clone.serializer_fn, new_mixin.serializer_fn)
    strictEq(clone.comparer_fn, new_mixin.comparer_fn)
  })

  it('Decimal_Schema', () => {
    const min = '2.22'
    const max = '3.33'
    const base = new Decimal_Schema('old type', old_mixin, min, max)
    const clone = base.clone('new type', new_mixin)
    strictEq(clone instanceof Decimal_Schema, true)
    strictEq(clone.type, 'new type')
    strictEq(clone.min_string, min)
    strictEq(clone.max_string, max)
    deepEq(clone.min, base.min)
    deepEq(clone.max, base.max)

    ok(clone.parser_fn); ok(clone.serializer_fn)
    strictEq(clone.parser_fn, new_mixin.parser_fn)
    strictEq(clone.serializer_fn, new_mixin.serializer_fn)
    strictEq(clone.comparer_fn, new_mixin.comparer_fn)
  })
})
