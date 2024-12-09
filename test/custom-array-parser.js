'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_parser_functions({array:(a)=>a.length})

function run_valid(t) {
  it(t[3], () => {
    const p = bobson.get_parser(t[0])
    const result = p.parse(t[1])
    deepEq(result, t[2])
  })
}

function run_invalid(t) {
  it(t[3], () => {
    try {
      const p = bobson.get_parser(t[0])
      p.parse(t[1])
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq(err.message, t[2])
    }
  })
}

describe('custom array parsers', () => {

  describe('top-level-array', () => {
    describe('array valid', () => {
      const tests = [
        [['string 0 1','0 2'], '[]', 0, 'empty'],
        [['string 0 1','0 2'], '["a"]', 1, 'single elem'],
        [['string 0 1','0 2'], '["a","b"]', 2, 'two elems'],
        [[['string 0 1','0 2'],'0 2'], '[["a","b"]]', 1, 'recursive'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

    describe('?array valid', () => {
      const tests = [
        [['?','string 0 1','0 2'], '[]', 0, 'empty'],
        [['?','string 0 1','0 2'], '["a"]', 1, 'single elem'],
        [['?','string 0 1','0 2'], '["a","b"]', 2, 'two elems'],
        [[['?','string 0 1','0 2'],'0 2'], '[["a","b"]]', 1, 'recursive'],

        [['?','string 0 1','0 2'], 'null', null, 'null'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

    describe('array invalid', () => {
      const tests = [
        [['string 0 1','1 2'], '[]', 'Invalid array: too short', 'too short'],
        [['string 0 1','1 2'], '["a","b","c"]', 'Invalid array: too long', 'too long'],
        [[['string 0 1','2 2'],'2 2'], '[["a","b"]]', 'Invalid array: too short', '1st level too short'],
        [[['string 0 1','2 2'],'2 2'], '[["c"],["a","b"]]', 'Invalid array: too short', '2nd level too short'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })

    describe('?array invalid', () => {
      const tests = [
        [['?','string 0 1','1 2'], '[]', 'Invalid ?array: too short', 'too short'],
        [['?','string 0 1','1 2'], '["a","b","c"]', 'Invalid ?array: too long', 'too long'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })

    describe('non-nullable null', () => {
      const tests = [
        [['string 0 1','1 2'], 'null', 'Invalid array: null', 'too long'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })
  })

})
