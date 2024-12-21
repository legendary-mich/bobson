'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')

function run_valid(t) {
  it(t[3], () => {
    const builder = new Bobson_Builder()
    builder.add_derived_types({
      'custom_int': 'int_4 20 30',
    })
    const schema = builder.get_serializer(t[0])
    const result = schema.serialize(t[1])
    deepEq(result, t[2])
  })
}

function run_invalid(t) {
  it(t[3], () => {
    try {
      const builder = new Bobson_Builder()
      const schema = builder.get_serializer(t[0])
      schema.serialize(t[1])
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq(err.message, t[2])
    }
  })
}

describe('serializers', () => {
  describe('simple', () => {
    const tests = [
      ["string 0 10", 'ho', '"ho"', 'string 0 10'],
      ["string 0 10", 'h"o', '"h\\"o"', 'string 0 10 h"o'],
      ["string 0 10", 'h\\o', '"h\\\\o"', 'string 0 10 h\\o'],
      ["string 0 10", String.raw`h\o`, String.raw`"h\\o"`, 'string 0 10 h\\o raw'],
      ["int_4 0 10", 2, '"2"', 'int_4 0 10'],
      ["int_js 0 10", 3, '"3"', 'int_js 0 10'],
      ["int_8 0 10", 4n, '"4"', 'int_8 0 10'],
      ["custom_int", 21, '"21"', 'custom_int 21'],
      ["decimal 0.00 10.00", '2.34', '"2.34"', 'decimal 0.00 10.00'],
      ["enum olo", 'olo', '"olo"', 'enum olo'],
      ["bool", true, '"true"', 'bool true'],
      ["bool", false, '"false"', 'bool false'],
      [["object",{"+ bob":"string 0 10"}], {bob:'don'}, '{"bob":"don"}', 'obj bob'],
      [["object",{"+ bob":"string 0 10","+ hop":"string 0 10"}], {bob:'don',hop:'lo'}, '{"bob":"don","hop":"lo"}', 'obj bob hop'],
      [["array 0 10", "string 0 10"], ['don'], '["don"]', 'arr don'],
      [["array 0 10", "string 0 10"], ['don','olk'], '["don","olk"]', 'arr don olk'],

      ["?string 0 10", 'ho', '"ho"', '?string 0 10'],
      ["?string 0 10", 'h"o', '"h\\"o"', '?string 0 10 h"o'],
      ["?string 0 10", 'h\\o', '"h\\\\o"', '?string 0 10 h\\o'],
      ["?string 0 10", String.raw`h\o`, String.raw`"h\\o"`, '?string 0 10 h\\o raw'],
      ["?int_4 0 10", 2, '"2"', '?int_4 0 10'],
      ["?int_js 0 10", 3, '"3"', '?int_js 0 10'],
      ["?int_8 0 10", 4n, '"4"', '?int_8 0 10'],
      ["?custom_int", 21, '"21"', '?custom_int 21'],
      ["?decimal 0.00 10.00", '2.34', '"2.34"', '?decimal 0.00 10.00'],
      ["?enum olo", 'olo', '"olo"', '?enum olo'],
      ["?bool", true, '"true"', '?bool true'],
      ["?bool", false, '"false"', '?bool false'],
      [["?object",{"+ bob":"string 0 10"}], {bob:'don'}, '{"bob":"don"}', '?obj bob'],
      [["?array 0 10", "string 0 10"], ['don','olk'], '["don","olk"]', '?arr don olk'],

      ["?string 0 10", null, null, '?string null'],
      ["?int_4 0 10", null, null, '?int_4 null'],
      ["?int_js 0 10", null, null, '?int_js null'],
      ["?int_8 0 10", null, null, '?int_8 null'],
      ["?custom_int", null, null, '?custom_int null'],
      ["?decimal 0.00 10.00", null, null, '?decimal null'],
      ["?enum olo", null, null, '?enum null'],
      ["?bool", null, null, '?bool null'],
      [["?object",{"+ bob":"string 0 10"}], null, null, '?obj null'],
      [["?array 0 10", "string 0 10"], null, null, '?arr null'],
    ]
    for (const t of tests) {
      run_valid(t)

    }
  })

  describe('invalid', () => {
    const tests = [
      [null, 'ho', 'Unknown schema type: null', 'type null'],
      [() => {}, 'ho', 'Unknown schema type: Function', 'type function'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }

    it('not an object', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_serializer_functions(null)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: object, found: null')
      }
    })

    it('not a function', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_serializer_functions({
          'key': [],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: function, found: array')
      }
    })
  })

  describe('custom serializers', () => {
    it('mixed', () => {
      const builder = new Bobson_Builder()
      // add_serializer_functions should always come before add_derived_types
      builder.add_serializer_functions({
        'string': (value) => '"lolo"',
        'object': (value) => 223,
        'array': (value) => ({lobo:'lo'}),
        'custom_int': (value) => value * 2,
      })
      builder.add_derived_types({
        'custom_int': 'int_4 20 30',
      })

      // string ================================================================
      let schema = builder.get_serializer('string 0 10')
      let result = schema.serialize('bobo')
      deepEq(result, '"lolo"')

      schema = builder.get_serializer('?string 0 10')
      result = schema.serialize('bobo')
      deepEq(result, '"lolo"')

      schema = builder.get_serializer('?string 0 10')
      result = schema.serialize(null)
      deepEq(result, null)

      // object ================================================================
      schema = builder.get_serializer(["object",{}])
      result = schema.serialize({})
      deepEq(result, 223)

      schema = builder.get_serializer(["?object",{}])
      result = schema.serialize({})
      deepEq(result, 223)

      schema = builder.get_serializer(["?object",{}])
      result = schema.serialize(null)
      deepEq(result, null)

      // array =================================================================
      schema = builder.get_serializer(["array 0 1", "string 0 1"])
      result = schema.serialize([])
      deepEq(result, {lobo:'lo'})

      schema = builder.get_serializer(["?array 0 1", "string 0 1"])
      result = schema.serialize([])
      deepEq(result, {lobo:'lo'})

      schema = builder.get_serializer(["?array 0 1", "string 0 1"])
      result = schema.serialize(null)
      deepEq(result, null)

      // custom_int ============================================================
      schema = builder.get_serializer("custom_int")
      result = schema.serialize(23)
      deepEq(result, 46)

      schema = builder.get_serializer("custom_int")
      result = schema.serialize(24)
      deepEq(result, 48)

      schema = builder.get_serializer("custom_int")
      result = schema.serialize(null)
      deepEq(result, null)

    })
  })
})
