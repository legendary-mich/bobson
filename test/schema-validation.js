'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()

function run_invalid(t) {
  it(t[2], () => {
    try {
      bobson.get_parser(t[0])
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq(err.message, t[1])
    }
  })
}

describe('schema validation', () => {

  describe('unknown', () => {
    const tests = [
      ['what', 'Unknown schema type: what', 'what'],
      ['space in the name', 'Unknown schema type: space in the name', 'space in the name'],
      [222, 'Unknown schema type: Number', '222'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('complex type', () => {
    const tests = [
      [[], 'Unknown schema type: undefined', 'no type'],
      [["what"], 'Unknown schema type: what', 'unknown what'],
      [["=array"], 'Unknown schema type: =array', 'unknown =array'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('object', () => {
    const tests = [
      [["object"], 'Invalid Type. Expected: object, found: undefined', 'invalid object'],
      [["xobject", {}], 'Unknown schema type: xobject', 'xobject'],
      [["objectx", {}], 'Unknown schema type: objectx', 'objectx'],
      [["object",{"z bo":"what"}], 'Invalid prefix. Expected: (+/-) bo, found: (z) bo', 'invalid prefix'],
      [["object",{"+ bo":"what"}], 'Unknown schema type: what', 'obj unknown what'],
      [["object",{"+ bo":true}], 'Unknown schema type: Boolean', 'obj unknown true'],
      [["object",{"+ bo":"string"}], 'Invalid min_length param for string schema: undefined', 'obj invalid string param'],
      [["object",{"+ al":"string 0 1","- al":"int_4 0 1"}], 'Duplicate key found: al', 'duplicate key'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('array', () => {
    const tests = [
      [['!array 2 3', 'string 0 0'], 'Unknown schema type: !array 2 3', 'unknown schema !array'],
      [['array 2 3 4', 'string 0 0'], 'Unknown schema type: array 2 3 4', '3 length args'],
      [['array s 3', 'string 0 0'], 'Invalid min_length param for array schema: s', 'invalid min length'],
      [['array 2 z', 'string 0 0'], 'Invalid max_length param for array schema: z', 'invalid max length'],

      [['array 0 0'], 'Unknown schema type: undefined', 'arr no schema'],
      [['array 0 0', 'what'], 'Unknown schema type: what', 'arr unknown schema'],
      [['array 0 0', 'string 0'], 'Invalid max_length param for string schema: undefined', 'arr invalid child param'],
      [['array', 'string 0 0'], 'Invalid min_length param for array schema: undefined', 'arr missing min_length param'],
      [['array 0', 'string 0 0'], 'Invalid max_length param for array schema: undefined', 'arr missing max_length param'],
      [['array -1 0', 'string 0 0'], 'Invalid min_length param for array schema: -1', 'arr invalid min_length param'],
      [['array 0 -1', 'string 0 0'], 'Invalid max_length param for array schema: -1', 'arr invalid max_length param'],
      [['array 9007199254740992 0', 'string 0 0'], 'Invalid min_length param for array schema: 9007199254740992', 'arr min_length > max_max'],
      [['array 0 9007199254740992', 'string 0 0'], 'Invalid max_length param for array schema: 9007199254740992', 'arr max_length > max_max'],
      [['array 2 1', 'string 0 0'], 'Invalid max_length param for array schema: 1; max_length < min_length', 'min_length > max_length'],

      [['?array 2 1', 'string 0 0'], 'Invalid max_length param for ?array schema: 1; max_length < min_length', 'min_length > max_length in nullable'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('string', () => {
    const tests = [
      ['string', 'Invalid min_length param for string schema: undefined', 'string no params'],
      ['string -1', 'Invalid min_length param for string schema: -1', 'string min < 0'],
      ['string 0', 'Invalid max_length param for string schema: undefined', 'string no max param'],
      ['string 0 9007199254740992', 'Invalid max_length param for string schema: 9007199254740992', 'string max > max_max'],
      ['string 9 8', 'Invalid max_length param for string schema: 8; max_length < min_length', 'string min_length > max_length'],
      ['string 0 0 ?', 'Invalid regex param for string schema: ?', 'string invalid regex'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('enum', () => {
    const tests = [
      ['enum', 'Invalid enums param for enum schema: undefined', 'enum no params'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('int_4', () => {
    const tests = [
      ['int_4', 'Invalid min param for int_4 schema: undefined', 'int_4 no params'],
      ['int_4 0', 'Invalid max param for int_4 schema: undefined', 'int_4 missing max'],
      ['int_4 a 0', 'Invalid min param for int_4 schema: a', 'int_4 invalid min'],
      ['int_4 0 a', 'Invalid max param for int_4 schema: a', 'int_4 invalid max'],
      ['int_4 -2147483649 0', 'Invalid min param for int_4 schema: -2147483649; too small', 'int_4 min too small'],
      ['int_4 0 2147483648', 'Invalid max param for int_4 schema: 2147483648; too big', 'int_4 max too big'],
      ['int_4 10 9', 'Invalid max param for int_4 schema: 9; max < min', 'int_4 min > max'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('int_js', () => {
    const tests = [
      ['int_js', 'Invalid min param for int_js schema: undefined', 'int_js no params'],
      ['int_js 0', 'Invalid max param for int_js schema: undefined', 'int_js missing max'],
      ['int_js a 0', 'Invalid min param for int_js schema: a', 'int_js invalid min'],
      ['int_js 0 a', 'Invalid max param for int_js schema: a', 'int_js invalid max'],
      ['int_js -9007199254740992 0', 'Invalid min param for int_js schema: -9007199254740992; too small', 'int_js min too small'],
      ['int_js 0 9007199254740992', 'Invalid max param for int_js schema: 9007199254740992; too big', 'int_js max too big'],
      ['int_js 3 2', 'Invalid max param for int_js schema: 2; max < min', 'int_js min > max'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('int_8', () => {
    const tests = [
      ['int_8', 'Invalid min param for int_8 schema: undefined', 'int_8 no params'],
      ['int_8 0', 'Invalid max param for int_8 schema: undefined', 'int_8 missing max'],
      ['int_8 a 0', 'Invalid min param for int_8 schema: a', 'int_8 invalid min'],
      ['int_8 0 a', 'Invalid max param for int_8 schema: a', 'int_8 invalid max'],
      ['int_8 -9223372036854775809 0', 'Invalid min param for int_8 schema: -9223372036854775809; too small', 'int_8 min too small'],
      ['int_8 0 9223372036854775808', 'Invalid max param for int_8 schema: 9223372036854775808; too big', 'int_8 max too big'],
      ['int_8 -1 -2', 'Invalid max param for int_8 schema: -2; max < min', 'int_8 min > max'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('decimal', () => {
    const tests = [
      ['decimal', 'Invalid min param for decimal schema: undefined', 'decimal no params'],
      ['decimal 0', 'Invalid max param for decimal schema: undefined', 'decimal missing max'],
      ['decimal a 0', 'Invalid min param for decimal schema: a', 'decimal invalid min'],
      ['decimal 0 a', 'Invalid max param for decimal schema: a', 'decimal invalid max'],
      ['decimal 0.0 0.00', 'Invalid max param for decimal schema: 0.00; The number of fractional digits should be the same in both the min/max bounds. The min bound is: 0.0', 'decimal bounds mismatch'],
      ['decimal 2.2 2.1', 'Invalid max param for decimal schema: 2.1; max < min', 'decimal min > max'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })


  describe('object inheritance', () => {
    it('unknown source schema', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({
          "user": ["object",{
            "- name": "string 1 10",
          }],
          "employee": ["object",{
            "< koko": [],
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Unknown schema type: koko')
      }
    })

    it('not an instance of Object_Schema', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({
          "user": "string 0 20",
          "employee": ["object",{
            "< user": [],
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: Object_Schema, found: String_Schema')
      }
    })

    it('unknown malformed source fields', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({
          "user": ["object",{
            "- name": "string 1 10",
          }],
          "employee": ["object",{
            "< user": {},
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: array, found: Object')
      }
    })

    it('invalid prefix', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({
          "user": ["object",{
            "- name": "string 1 10",
          }],
          "employee": ["object",{
            "< user": ["o name"],
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid prefix. Expected: (+/-) name, found: (o) name')
      }
    })

    it('field already defined 1', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({
          "user": ["object",{
            "- name": "string 1 10",
          }],
          "employee": ["object",{
            "+ name": "string 1 10",
            "< user": ["+ name"],
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Duplicate key found: name')
      }
    })

    it('field already defined 2', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({
          "user": ["object",{
            "- name": "string 1 10",
          }],
          "employee": ["object",{
            "+ name": "string 1 10",
            "< user": ["- name"],
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Duplicate key found: name')
      }
    })

    it('unknown field', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({
          "user": ["object",{
            "- name": "string 1 10",
          }],
          "employee": ["object",{
            "+ name": "string 1 10",
            "< user": ["+ what"],
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Unknown key found: what')
      }
    })
  })

  describe('object inheritance with aliases', () => {
    it('dangling alias at the beginning', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({
          "user": ["object",{
            "- name": "string 1 10",
          }],
          "employee": ["object",{
            "< user": ["= name"],
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid prefix. Expected: (+/-) name, found: (=) name')
        deepEq(err.path, 'employee.< user')
      }
    })

    it('dangling alias at the end', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({
          "user": ["object",{
            "- name": "string 1 10",
          }],
          "employee": ["object",{
            "< user": ["+ uname", "= name", "= name"],
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid prefix. Expected: (+/-) name, found: (=) name')
        deepEq(err.path, 'employee.< user')
      }
    })

    it('field already defined', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({
          "user": ["object",{
            "- name": "string 1 10",
          }],
          "employee": ["object",{
            "< user": ["+ uname", "= name", "+ uname", "= name"],
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Duplicate key found: uname')
        deepEq(err.path, 'employee.< user')
      }
    })
  })

})
