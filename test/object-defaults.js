'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
let bobson

describe('object defaults', () => {
  before(() => {
    bobson = new Bobson_Builder()
  })

  describe('valid', () => {
    it('get_parser: populates the result with default values', () => {
      const p = bobson.get_parser(["object", {
        "+ one": "string 0 10",
        "+ two": "string 0 10",
        "- three": "string 0 10",
        "- four": "string 0 10",
        "- num": "int_4 0 10",
        "- n_num": "?int_4 0 10",
      }, {
        "one": "lolo",
        "two": "bonk",
        "three": "doll",
        "four": "zonk",
        "num": "4",
        "n_num": null,
      }])
      const result = p.parse('{"one":"aa","three":"bb"}')
      deepEq(result, {one: 'aa', two:'bonk', three: 'bb', four: 'zonk', num: 4, n_num: null})
    })

    it('add_derived_types: populates the result with default values', () => {
      const bobson = new Bobson_Builder()
      bobson.add_derived_types({
        "bobo":["object", {
          "+ one": "string 0 10",
          "+ two": "string 0 10",
          "- three": "string 0 10",
          "- four": "string 0 10",
          "- num": "int_4 0 10",
          "- n_num": "?int_4 0 10",
        }, {
          "one": "lolo",
          "two": "bonk",
          "three": "doll",
          "four": "zonk",
          "num": "4",
          "n_num": null,
        }],
      })
      const p = bobson.get_parser('bobo')
      const result = p.parse('{"one":"aa","three":"bb"}')
      deepEq(result, {one: 'aa', two:'bonk', three: 'bb', four: 'zonk', num: 4, n_num: null})
    })
  })

  describe('invalid', () => {

    it('get_parser: unknown default', () => {
      try {
        bobson.get_parser(["object", {
          "+ one": "int_4 0 10",
        }, {
          "two": "b",
        }])
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Unknown key found: two')
        deepEq(err.path, '.two')
      }
    })

    it('add_derived_types: unknown default', () => {
      try {
        const bobson = new Bobson_Builder()
        bobson.add_derived_types({
          "lolo": ["object", {
            "+ one": "int_4 0 10",
          }, {
            "two": "b",
          }],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Unknown key found: two')
        deepEq(err.path, 'lolo.two')
      }
    })

    it('int does not match the regex', () => {
      try {
        bobson.get_parser(["object", {
          "+ one": "int_4 0 10",
        }, {
          "one": "b",
        }])
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid int_4: does not match regex')
        deepEq(err.path, '.one')
      }
    })

    it('int as a number', () => {
      try {
        bobson.get_parser(["object", {
          "+ one": "int_4 0 10",
        }, {
          "one": 4,
        }])
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid default param for int_4 schema: one; It should come as a string')
        deepEq(err.path, '.one')
      }
    })

    it('null not permitted', () => {
      try {
        bobson.get_parser(["object", {
          "+ one": "int_4 0 10",
        }, {
          "one": null,
        }])
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid int_4: null')
        deepEq(err.path, '.one')
      }
    })

    it('string too long', () => {
      try {
        bobson.get_parser(["object", {
          "+ one": "string 0 3",
        }, {
          "one": "abac",
        }])
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid string: too long')
        deepEq(err.path, '.one')
      }
    })

    it('objects not supported', () => {
      try {
        bobson.get_parser(["object", {
          "+ one": ["object", {"+ a": "string 0 10"}],
        }, {
          "one": {a: "b"},
        }])
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid default param for object schema: one; Defaults are not supported for arrays and objects')
        deepEq(err.path, '.one')
      }
    })

    it('?objects not supported', () => {
      try {
        bobson.get_parser(["object", {
          "+ one": ["?object", {"+ a": "string 0 10"}],
        }, {
          "one": {a: "b"},
        }])
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid default param for ?object schema: one; Defaults are not supported for arrays and objects')
        deepEq(err.path, '.one')
      }
    })

    it('arrays not supported', () => {
      try {
        bobson.get_parser(["object", {
          "+ one": ["array 0 10", "string 0 10"],
        }, {
          "one": {a: "b"},
        }])
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid default param for array schema: one; Defaults are not supported for arrays and objects')
        deepEq(err.path, '.one')
      }
    })

    it('?arrays not supported', () => {
      try {
        bobson.get_parser(["object", {
          "+ one": ["?array 0 10", "string 0 10"],
        }, {
          "one": {a: "b"},
        }])
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid default param for ?array schema: one; Defaults are not supported for arrays and objects')
        deepEq(err.path, '.one')
      }
    })
  })

})
