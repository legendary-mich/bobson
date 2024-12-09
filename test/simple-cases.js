'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()

describe('simple cases', () => {

  describe('string', () => {
    it('abc', () => {
      const p = bobson.get_parser("string 0 32")
      const result = p.parse('"abc"')
      deepEq(result, 'abc')
    })
  })

  describe('?string', () => {
    it('dogo', () => {
      const p = bobson.get_parser("?string 0 32")
      const result = p.parse('"dogo"')
      deepEq(result, 'dogo')
    })

    it('null', () => {
      const p = bobson.get_parser("?string 0 32")
      const result = p.parse('null')
      deepEq(result, null)
    })

    describe('string + regex', () => {
      it('abc', () => {
        const p = bobson.get_parser("string 0 32 ^abc$")
        const result = p.parse('"abc"')
        deepEq(result, 'abc')
      })
    })
  })

  describe('integer', () => {
    it('int_4 222', () => {
      const p = bobson.get_parser("int_4 0 320")
      const result = p.parse('"222"')
      deepEq(result, 222)
    })

    it('int_js 222', () => {
      const p = bobson.get_parser("int_js 0 320")
      const result = p.parse('"222"')
      deepEq(result, 222)
    })

    it('int_8 222', () => {
      const p = bobson.get_parser("int_8 0 320")
      const result = p.parse('"222"')
      deepEq(result, 222n)
    })
  })

  describe('decimal', () => {
    it('21.20', () => {
      const p = bobson.get_parser("decimal 0.00 30.00")
      const result = p.parse('"21.20"')
      deepEq(result, '21.20')
    })

    it('-21.20', () => {
      const p = bobson.get_parser("decimal -30.00 30.00")
      const result = p.parse('"-21.20"')
      deepEq(result, '-21.20')
    })
  })

  describe('{}', () => {
    it('empty', () => {
      const p = bobson.get_parser({})
      const result = p.parse('{}')
      deepEq(result, {})
    })

    it('-string', () => {
      const p = bobson.get_parser({"- bobo": "string 0 32"})
      const result = p.parse('{}')
      deepEq(result, {})
    })

    it('+string, +string', () => {
      const p = bobson.get_parser({"+ bobo": "string 0 32", "+ lobo": "string 0 32"})
      const result = p.parse('{"bobo":"l","lobo":"kom"}')
      deepEq(result, {bobo: 'l', lobo: 'kom'})
    })

    it('recursive {}', () => {
      const p = bobson.get_parser({"+ zozo": {"+ bobo": "string 1 2"}})
      const result = p.parse('{"zozo":{"bobo":"l"}}')
      deepEq(result, {zozo: {bobo: 'l'}})
    })
  })

  describe('{"?":true}', () => {
    it('empty empty', () => {
      const p = bobson.get_parser({"?":true})
      const result = p.parse('{}')
      deepEq(result, {})
    })

    it('empty null', () => {
      const p = bobson.get_parser({"?":true})
      const result = p.parse('null')
      deepEq(result, null)
    })

    it('recursive null', () => {
      const p = bobson.get_parser({"+ i": {"?":true}})
      const result = p.parse('{"i":null}')
      deepEq(result, {i: null})
    })
  })

  describe('[]', () => {
    it('empty', () => {
      const p = bobson.get_parser(["string 0 20", "0 1"])
      const result = p.parse('[]')
      deepEq(result, [])
    })

    it('null', () => {
      const p = bobson.get_parser(["?", "string 0 20", "0 1"])
      const result = p.parse('null')
      deepEq(result, null)
    })

    it('full', () => {
      const p = bobson.get_parser(["string 0 20", "0 2"])
      const result = p.parse('["aba","zozo"]')
      deepEq(result, ['aba', 'zozo'])
    })

    it('recursive', () => {
      const p = bobson.get_parser([["string 0 20", "0 2"], "0 1"])
      const result = p.parse('[["aba","zozo"]]')
      deepEq(result, [['aba', 'zozo']])
    })
  })

  describe('enum', () => {
    it('tripple', () => {
      const p = bobson.get_parser("enum alo olo bonk")
      const result = p.parse('"olo"')
      deepEq(result, 'olo')
    })
  })

  describe('invalid', () => {
    it('has already finished', () => {
      try {
        const p = bobson.get_parser("string 0 32")
        p.parse('"abc"')
        p.parse('"abc"')
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Parser has already finished. There are redundant characters after the enclosing char')
      }
    })

    it('empty payload', () => {
      try {
        const p = bobson.get_parser("string 0 32")
        p.parse('')
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Incomplete payload. Some characters are missing at the end')
      }
    })

    it('parse(null)', () => {
      try {
        const p = bobson.get_parser("string 0 32")
        p.parse(null)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: string, found: null')
      }
    })

    it('parse_chunk(22)', () => {
      try {
        const p = bobson.get_parser("string 0 32")
        p.parse_chunk(22)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: string, found: Number')
      }
    })
  })

  describe('custom schemas', () => {
    const bobson = new Bobson_Builder()
    it('color', () => {
      const schema = "color"
      const definitions = {
        "color": "enum red green blue",
      }
      bobson.add_derived_types(definitions)
      const p = bobson.get_parser(schema)
      const result = p.parse('"green"')
      deepEq(result, 'green')
    })
  })

  describe('custom parser functions', () => {
    it('string', () => {
      const schema = "string 0 20"
      const parsers = {
        string: (s) => s.length,
      }
      const bobson = new Bobson_Builder()
      bobson.add_parser_functions(parsers)
      const p = bobson.get_parser(schema)
      const result = p.parse('"green"')
      deepEq(result, 5)
    })

    it('?string', () => {
      const schema = "?string 0 20"
      const parsers = {
        'string': (s) => s.length,
      }
      const bobson = new Bobson_Builder()
      bobson.add_parser_functions(parsers)
      const p = bobson.get_parser(schema)
      const result = p.parse('"green"')
      deepEq(result, 5)
    })

    it('object', () => {
      const schema = {"+ name": "string 0 20"}
      const parsers = {
        string: (s) => s.length,
      }
      const bobson = new Bobson_Builder()
      bobson.add_parser_functions(parsers)
      const p = bobson.get_parser(schema)
      const result = p.parse('{"name":"hank"}')
      deepEq(result, {name:4})
    })

    it('array', () => {
      const schema = ["string 0 20", "0 4"]
      const parsers = {
        string: (s) => s.length,
      }
      const bobson = new Bobson_Builder()
      bobson.add_parser_functions(parsers)
      const p = bobson.get_parser(schema)
      const result = p.parse('["na","hank"]')
      deepEq(result, [2, 4])
    })
  })
})
