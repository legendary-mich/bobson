'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()

function run_valid(t) {
  const payload = t[1]
  for (let i=1; i<payload.length; ++i) {
    const prefix = payload.slice(0, i)
    const suffix = payload.slice(i)
    it(`'${t[3]}':${i}`, () => {
      const p = bobson.get_parser(t[0])
      p.parse_chunk(prefix)
      p.parse_chunk(suffix)
      const result = p.get_result()
      deepEq(result, t[2])
    })
  }
}

function run_invalid(t) {
  const payload = t[1]
  for (let i=1; i<payload.length; ++i) {
    const prefix = payload.slice(0, i)
    const suffix = payload.slice(i)
    it(`'${t[3]}':${i}`, () => {
      try {
        const p = bobson.get_parser(t[0])
        p.parse_chunk(prefix)
        p.parse_chunk(suffix)
        p.get_result()
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, t[2])
      }
    })
  }
}

describe('parse_chunk', () => {

  describe('empty strings in parse_chunk', () => {
    it('two letters', () => {
      const bobson = new Bobson_Builder()
      const p = bobson.get_parser("string 1 2")
      p.parse_chunk('')
      p.parse_chunk('"h')
      p.parse_chunk('')
      p.parse_chunk('a"')
      p.parse_chunk('')
      const result = p.get_result()
      deepEq(result, "ha")
    })
  })

  describe('split the payload at every character', () => {
    describe('valid', () => {
      const tests = [
        ['string 1 1', '"1"', '1', 'string 1 1'],
        ['string 10 10', '"1234567890"', '1234567890', 'string 10 10'],
        ['?string 10 10', '"1234567890"', '1234567890', '?string 10 10'],
        ['?string 10 10', 'null', null, '?string null'],
        ['string 0 10', '"a\\"b"', 'a"b', 'string a"b'],
        ['string 0 10', '"a\\nb"', 'anb', 'string anb'],
        ['string 0 10', '"a\nb"', 'a\nb', 'string a<newline>b'],

        ['enum olo and', '"olo"', 'olo', 'enum olo'],
        ['enum olo and', '"and"', 'and', 'enum and'],
        ['?enum olo and', '"and"', 'and', '?enum and'],
        ['?enum olo and', 'null', null, '?enum null'],

        ['bool', '"true"', true, 'bool true'],
        ['bool', '"false"', false, 'bool false'],
        ['?bool', '"false"', false, '?bool false'],
        ['?bool', 'null', null, '?bool null'],

        ['int_4 -10 10', '"9"', 9, 'int_4 9'],
        ['int_4 -10 10', '"-9"', -9, 'int_4 -9'],
        ['int_4 -100 100', '"99"', 99, 'int_4 99'],
        ['int_4 -100 100', '"-99"', -99, 'int_4 -99'],
        ['?int_4 -100 100', '"99"', 99, '?int_4 99'],
        ['?int_4 -100 100', 'null', null, '?int_4 null'],

        ['int_js -10 10', '"9"', 9, 'int_js 9'],
        ['int_js -10 10', '"-9"', -9, 'int_js -9'],
        ['int_js -100 100', '"99"', 99, 'int_js 99'],
        ['int_js -100 100', '"-99"', -99, 'int_js -99'],
        ['?int_js -100 100', '"99"', 99, '?int_js 99'],
        ['?int_js -100 100', 'null', null, '?int_js null'],

        ['int_8 -10 10', '"9"', 9n, 'int_8 9'],
        ['int_8 -10 10', '"-9"', -9n, 'int_8 -9'],
        ['int_8 -100 100', '"99"', 99n, 'int_8 99'],
        ['int_8 -100 100', '"-99"', -99n, 'int_8 -99'],
        ['?int_8 -100 100', '"99"', 99n, '?int_8 99'],
        ['?int_8 -100 100', 'null', null, '?int_8 null'],

        ['decimal -10 10', '"9"', '9', 'decimal 9'],
        ['decimal -10 10', '"-9"', '-9', 'decimal -9'],
        ['decimal -100 100', '"99"', '99', 'decimal 99'],
        ['decimal -100 100', '"-99"', '-99', 'decimal -99'],
        ['?decimal -100 100', '"99"', '99', '?decimal 99'],
        ['?decimal -100 100', 'null', null, '?decimal null'],
        ['decimal -10.00 10.00', '"9.01"', '9.01', 'decimal 9.01'],
        ['decimal -10.00 10.00', '"-9.32"', '-9.32', 'decimal -9.32'],
        ['decimal -100.00 100.00', '"99.8"', '99.8', 'decimal 99.8'],
        ['decimal -100.00 100.00', '"-99.10"', '-99.10', 'decimal -99.10'],
        ['?decimal -100.00 100.00', '"99.54"', '99.54', '?decimal 99.54'],

        [["array 0 10", "string 0 10"], '[]', [], 'arr empty'],
        [["array 0 10", "string 0 10"], '["0","123","45"]', ['0','123','45'], 'arr string'],
        [["array 0 10", "int_4 0 200"], '["0","123","45"]', [0,123,45], 'arr int'],
        [["?array 0 10", "int_4 0 200"], '["0","123","45"]', [0,123,45], '?arr'],
        [["?array 0 10", "int_4 0 200"], 'null', null, '?arr null'],
        [["array 0 10", ["array 0 10", "int_4 0 200"]], '[["0","123"],["2"]]', [[0,123],[2]], 'arr[]'],
        [["array 0 10", ["object",{"- olo":"string 0 1"}]], '[{},{"olo":"a"}]', [{},{olo:'a'}], 'arr obj'],

        [["object",{}], '{}', {}, 'obj empty'],
        [["object",{"+ olo":"string 0 10","+ bob":"int_4 0 2"}], '{"olo":"ha","bob":"2"}', {olo:'ha',bob:2}, 'obj 2 fields'],
        [["object",{"+ bat":["object",{}]}], '{"bat":{}}', {bat:{}}, 'obj recursive'],
        [["?object",{"+ bob":"int_4 0 2"}], '{"bob":"2"}', {bob:2}, '?obj bob'],
        [["?object",{"+ bob":"int_4 0 2"}], 'null', null, '?obj null'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

    describe('invalid', () => {
      const tests = [
        ['string 1 1', '1"', 'Invalid string opening char. Expected: ", found: 1', 'string invalid start'],
        ['string 1 1', '"1', 'Incomplete payload. Some characters are missing at the end', 'string no enclosing'],
        ['string 1 1', '"11"', 'Invalid string: too long', 'string too long'],
        ['string 1 1', 'null', 'Invalid string: null', 'string null'],

        [["array 0 10", "string 0 10"], '"a"]', 'Invalid array opening char. Expected: [, found: "', 'arr invalid start'],
        [["array 0 10", "string 0 10"], '["a",]', 'Invalid string opening char. Expected: ", found: ]', 'arr string start'],
        [["array 0 10", "string 0 10"], '["a""b"]', 'Invalid array enclosing char. Expected: , or ], found: "', 'arr end or comma'],
        [["array 0 10", "string 0 10"], '["a","b"', 'Incomplete payload. Some characters are missing at the end', 'arr enclosing'],

        [["object",{"+ olo":"string 0 10","+ bob":"int_4 0 2"}], '"olo":"ha","bob":"2"}', 'Invalid object opening char. Expected: {, found: "', 'obj start'],
        [["object",{"+ olo":"string 0 10","+ bob":"int_4 0 2"}], '{"olo":"ha""bob":"2"}', 'Invalid object enclosing char. Expected: , or }, found: "', 'obj comma'],
        [["object",{"+ olo":"string 0 10","+ bob":"int_4 0 2"}], '{"olo":"ha",}', 'Invalid string opening char. Expected: ", found: }', 'obj mem-string start'],
        [["object",{"+ olo":"string 0 10","+ bob":"int_4 0 2"}], '{"olo":"ha","bob"}', 'Invalid object member-colon. Expected: :, found: }', 'obj mem-colon'],
        [["object",{"+ olo":"string 0 10","+ bob":"int_4 0 2"}], '{"olo":"ha","bob":}', 'Invalid string opening char. Expected: ", found: }', 'obj int_4'],
        [["object",{"+ olo":"string 0 10","+ bob":"int_4 0 2"}], '{"olo":"ha","bob":"2"', 'Incomplete payload. Some characters are missing at the end', 'obj enclosing'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })
  })

  describe('string', () => {
    it('two letters', () => {
      const p = bobson.get_parser("string 1 2")
      p.parse_chunk('"a')
      p.parse_chunk('b"')
      const result = p.get_result()
      deepEq(result, 'ab')
    })
  })

  describe('?string', () => {
    it('two letters', () => {
      const p = bobson.get_parser("?string 0 2")
      p.parse_chunk('"a')
      p.parse_chunk('b"')
      const result = p.get_result()
      deepEq(result, 'ab')
    })

    it('null', () => {
      const p = bobson.get_parser("?string 0 1")
      p.parse_chunk('nu')
      p.parse_chunk('ll')
      const result = p.get_result()
      deepEq(result, null)
    })
  })

  describe('{}', () => {
    it('empty', () => {
      const p = bobson.get_parser(["object",{}])
      p.parse_chunk('{')
      p.parse_chunk('}')
      const result = p.get_result()
      deepEq(result, {})
    })

    it('+string', () => {
      const p = bobson.get_parser(["object",{"+ bobo": "string 1 2"}])
      p.parse_chunk('{"bobo"')
      p.parse_chunk(':"l"}')
      const result = p.get_result()
      deepEq(result, {bobo: 'l'})
    })
  })
})
