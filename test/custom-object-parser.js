'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_parser_functions({object:(o)=>Object.keys(o).length})

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

describe('custom object parsers', () => {

  describe('top-level-object', () => {
    describe('object valid', () => {
      const tests = [
        [{"- bob": "string 0 2"}, '{}', 0, 'optional empty'],
        [{"- bob": "string 0 2"}, '{"bob":"lo"}', 1, 'optional 1 field'],
        [{"+ bob": "string 0 2"}, '{"bob":"lo"}', 1, 'required 1 field'],
        [{"+ bob": "string 0 2","+ lob": "string 0 2"}, '{"bob":"lo","lob":"ho"}', 2, 'required 2 fields'],

        [{"- bob": {"- lo":"string 0 2"}}, '{}', 0, 'recursive empty'],
        [{"- bob": {"- lo":"string 0 2"}}, '{"bob":{}}', 1, 'recursive 1 field'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

    describe('?object valid', () => {
      const tests = [
        [{"?":true,"- bob": "string 0 2"}, '{}', 0, 'optional empty'],
        [{"?":true,"- bob": "string 0 2"}, '{"bob":"lo"}', 1, 'optional 1 field'],
        [{"?":true,"+ bob": "string 0 2"}, '{"bob":"lo"}', 1, 'required 1 field'],
        [{"?":true,"+ bob": "string 0 2","+ lob": "string 0 2"}, '{"bob":"lo","lob":"ho"}', 2, 'required 2 fields'],

        [{"?":true,"- bob": "string 0 2"}, 'null', null, 'null'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

    describe('object missing required', () => {
      const tests = [
        [{"+ bob": "string 0 2"}, '{}', 'Invalid object: missing required field: bob', 'required 1 field'],
        [{"+ bob": {"+ lo":"string 0 2"}}, '{}', 'Invalid object: missing required field: bob', 'recursive 1st level'],
        [{"+ bob": {"+ lo":"string 0 2"}}, '{"bob":{}}', 'Invalid object: missing required field: lo', 'recursive 2nd level'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })

    describe('?object missing required', () => {
      const tests = [
        [{"?":true,"+ bob": "string 0 2"}, '{}', 'Invalid ?object: missing required field: bob', 'required 1 field'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })

    describe('non-nullable null', () => {
      const tests = [
        [{"- bob": "string 0 2"}, 'null', 'Invalid object: null', 'null'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })
  })

})
