'use strict'

const Big = require('big.js')
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
      ["string 0 10", 'h""o', '"h\\"\\"o"', 'string 0 10 h""o'],
      ["string 0 10", 'h\\o', '"h\\\\o"', 'string 0 10 h\\o'],
      ["string 0 10", String.raw`h\o`, String.raw`"h\\o"`, 'string 0 10 h\\o raw'],
      ["string 0 10", String.raw`h\\o`, String.raw`"h\\\\o"`, 'string 0 10 h\\\\o raw'],
      ["int_4 0 10", 2, '"2"', 'int_4 0 10'],
      ["int_js 0 10", 3, '"3"', 'int_js 0 10'],
      ["int_8 0 10", 4n, '"4"', 'int_8 0 10'],
      ["custom_int", 21, '"21"', 'custom_int 21'],
      ["decimal 0.00 10.00", new Big('2.34'), '"2.34"', 'decimal 0.00 10.00'],
      ["enum olo", 'olo', '"olo"', 'enum olo'],
      ["bool", true, '"true"', 'bool true'],
      ["bool", false, '"false"', 'bool false'],
      [["object",{"+ bob":"string 0 10"}], {bob:'don'}, '{"bob":"don"}', 'obj bob'],
      [["object",{"+ bob":"string 0 10","+ hop":"string 0 10"}], {bob:'don',hop:'lo'}, '{"bob":"don","hop":"lo"}', 'obj bob hop'],
      [["array 0 10", "string 0 10"], ['don'], '["don"]', 'arr don'],
      [["array 0 10", "string 0 10"], ['don','olk'], '["don","olk"]', 'arr don olk'],

      ["?string 0 10", 'ho', '"ho"', '?string 0 10'],
      ["?string 0 10", 'h"o', '"h\\"o"', '?string 0 10 h"o'],
      ["?string 0 10", 'h""o', '"h\\"\\"o"', '?string 0 10 h""o'],
      ["?string 0 10", 'h\\o', '"h\\\\o"', '?string 0 10 h\\o'],
      ["?string 0 10", String.raw`h\o`, String.raw`"h\\o"`, '?string 0 10 h\\o raw'],
      ["?string 0 10", String.raw`h\\o`, String.raw`"h\\\\o"`, '?string 0 10 h\\\\o raw'],
      ["?int_4 0 10", 2, '"2"', '?int_4 0 10'],
      ["?int_js 0 10", 3, '"3"', '?int_js 0 10'],
      ["?int_8 0 10", 4n, '"4"', '?int_8 0 10'],
      ["?custom_int", 21, '"21"', '?custom_int 21'],
      ["?decimal 0.00 10.00", new Big('2.34'), '"2.34"', '?decimal 0.00 10.00'],
      ["?enum olo", 'olo', '"olo"', '?enum olo'],
      ["?bool", true, '"true"', '?bool true'],
      ["?bool", false, '"false"', '?bool false'],
      [["?object",{"+ bob":"string 0 10"}], {bob:'don'}, '{"bob":"don"}', '?obj bob'],
      [["?array 0 10", "string 0 10"], ['don','olk'], '["don","olk"]', '?arr don olk'],

      ["?string 0 10", null, 'null', '?string null'],
      ["?int_4 0 10", null, 'null', '?int_4 null'],
      ["?int_js 0 10", null, 'null', '?int_js null'],
      ["?int_8 0 10", null, 'null', '?int_8 null'],
      ["?custom_int", null, 'null', '?custom_int null'],
      ["?decimal 0.00 10.00", null, 'null', '?decimal null'],
      ["?enum olo", null, 'null', '?enum null'],
      ["?bool", null, 'null', '?bool null'],
      [["?object",{"+ bob":"string 0 10"}], null, 'null', '?obj null'],
      [["?array 0 10", "string 0 10"], null, 'null', '?arr null'],
    ]
    for (const t of tests) {
      run_valid(t)

    }
  })

  describe('custom serializers', () => {
    it('mixed', () => {
      const builder = new Bobson_Builder()
      builder.override_mixin('string', {
        parser_fn: r => r,
        serializer_fn: (value) => 'lolo',
      })
      builder.override_mixin('object', {
        parser_fn: r => r,
        serializer_fn: (object, object_schema) => {
          let res = ''
          for (const [key, val] of Object.entries(object)) {
            const child_schema = object_schema.fields.get(key)
            if (child_schema) {
              res += `${child_schema.serialize(val)}---${key}`
            }
          }
          return res
        },
      })
      builder.override_mixin('array', {
        parser_fn: r => r,
        serializer_fn: (array, array_schema) => {
          let res = ''
          const schema = array_schema.child_schema
          for (const val of array) {
            res += `--${schema.serialize(val)}-?-`
          }
          return res
        },
      })
      builder.add_derived_type('custom_int', 'int_4 20 30', {
        parser_fn: parseFloat,
        serializer_fn: (value) => value * 2,
        comparer_fn: (a,b) => a > b ? 1 : a === b ? 0 : -1,
      })
      builder.add_derived_type('custom_cloned', 'custom_int')
      builder.add_derived_type('custom_cloned_x2', 'custom_int', {
        parser_fn: parseFloat,
        serializer_fn: (value) => value * 3,
        comparer_fn: (a,b) => a > b ? 1 : a === b ? 0 : -1,
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
      deepEq(result, 'null')

      // object ================================================================
      schema = builder.get_serializer(["object",{"+ bob":"string 0 10"}])
      result = schema.serialize({bob:'x'})
      deepEq(result, '{"lolo"---bob}')

      schema = builder.get_serializer(["?object",{"+ bob":"string 0 10"}])
      result = schema.serialize({bob:'y'})
      deepEq(result, '{"lolo"---bob}')

      schema = builder.get_serializer(["?object",{"+ bob":"string 0 10"}])
      result = schema.serialize(null)
      deepEq(result, 'null')

      // array =================================================================
      schema = builder.get_serializer(["array 0 1", "string 0 1"])
      result = schema.serialize(['x'])
      deepEq(result, '[--"lolo"-?-]')

      schema = builder.get_serializer(["?array 0 1", "string 0 1"])
      result = schema.serialize(['y'])
      deepEq(result, '[--"lolo"-?-]')

      schema = builder.get_serializer(["?array 0 1", "string 0 1"])
      result = schema.serialize(null)
      deepEq(result, 'null')

      // custom_int ============================================================
      schema = builder.get_serializer("custom_int")
      result = schema.serialize(23)
      deepEq(result, '"46"')

      schema = builder.get_serializer("custom_int")
      result = schema.serialize(24)
      deepEq(result, '"48"')

      schema = builder.get_serializer("custom_int")
      result = schema.serialize(null)
      deepEq(result, 'null')

      // custom_cloned =========================================================
      schema = builder.get_serializer("custom_cloned")
      result = schema.serialize(23)
      deepEq(result, '"46"')

      schema = builder.get_serializer("custom_cloned")
      result = schema.serialize(24)
      deepEq(result, '"48"')

      schema = builder.get_serializer("custom_cloned")
      result = schema.serialize(null)
      deepEq(result, 'null')

      // custom_cloned x2 ======================================================
      schema = builder.get_serializer("custom_cloned_x2")
      result = schema.serialize(23)
      deepEq(result, '"69"')

      schema = builder.get_serializer("custom_cloned_x2")
      result = schema.serialize(24)
      deepEq(result, '"72"')

      schema = builder.get_serializer("custom_cloned_x2")
      result = schema.serialize(null)
      deepEq(result, 'null')

    })
  })
})
