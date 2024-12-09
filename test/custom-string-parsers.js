'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_parser_functions({string:(s)=>s.length})

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

describe('custom string parsers', () => {

  describe('top-level-string', () => {
    describe('string valid', () => {
      const tests = [
        ['string 0 0', '""', 0, '0 0 empty'],
        ['string 0 1', '""', 0, '0 1 empty'],
        ['string 1 1', '"a"', 1, '1 1 a'],
        ['string 0 1', '"a"', 1, '0 1 a'],
        ['string 1 2', '"a"', 1, '1 2 a'],
        ['string 0 2', '"a"', 1, '0 2 a'],
        ['string 2 2', '"bc"', 2, '2 2 bc'],
        ['string 1 2', '"bc"', 2, '1 2 bc'],
        ['string 2 3', '"bc"', 2, '2 3 bc'],
        ['string 1 3', '"bc"', 2, '1 3 bc'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

    describe('?string valid', () => {
      const tests = [
        ['?string 0 0', '""', 0, '0 0 empty'],
        ['?string 0 1', '""', 0, '0 1 empty'],
        ['?string 1 1', '"a"', 1, '1 1 a'],
        ['?string 0 1', '"a"', 1, '0 1 a'],
        ['?string 1 2', '"a"', 1, '1 2 a'],
        ['?string 0 2', '"a"', 1, '0 2 a'],
        ['?string 2 2', '"bc"', 2, '2 2 bc'],
        ['?string 1 2', '"bc"', 2, '1 2 bc'],
        ['?string 2 3', '"bc"', 2, '2 3 bc'],
        ['?string 1 3', '"bc"', 2, '1 3 bc'],

        ['?string 0 0', 'null', null, '0 0 null'],
        ['?string 0 1', 'null', null, '0 1 null'],
        ['?string 5 5', 'null', null, '5 5 null'],
        ['?string 5 6', 'null', null, '5 6 null'],

        ['?string 0 6', '"null"', 4, '0 6 quoted null'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

    describe('string too short', () => {
      const tests = [
        ['string 1 1', '""', 'Invalid string: too short', '1 1 empty'],
        ['string 1 2', '""', 'Invalid string: too short', '1 2 empty'],
        ['string 2 2', '"a"', 'Invalid string: too short', '2 2 a'],
        ['string 2 3', '"a"', 'Invalid string: too short', '2 3 a'],
        ['string 3 3', '"bc"', 'Invalid string: too short', '3 3 bc'],
        ['string 3 4', '"bc"', 'Invalid string: too short', '3 4 bc'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })

    describe('?string too short', () => {
      const tests = [
        ['?string 1 1', '""', 'Invalid ?string: too short', '1 1 empty'],
        ['?string 1 2', '""', 'Invalid ?string: too short', '1 2 empty'],
        ['?string 2 2', '"a"', 'Invalid ?string: too short', '2 2 a'],
        ['?string 2 3', '"a"', 'Invalid ?string: too short', '2 3 a'],
        ['?string 3 3', '"bc"', 'Invalid ?string: too short', '3 3 bc'],
        ['?string 3 4', '"bc"', 'Invalid ?string: too short', '3 4 bc'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })

    describe('string too long', () => {
      const tests = [
        ['string 0 0', '"a"', 'Invalid string: too long', '0 0 a'],
        ['string 0 1', '"bc"', 'Invalid string: too long', '0 1 bc'],
        ['string 1 1', '"bc"', 'Invalid string: too long', '1 1 bc'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })

    describe('?string too long', () => {
      const tests = [
        ['?string 0 0', '"a"', 'Invalid ?string: too long', '0 0 a'],
        ['?string 0 1', '"bc"', 'Invalid ?string: too long', '0 1 bc'],
        ['?string 1 1', '"bc"', 'Invalid ?string: too long', '1 1 bc'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })

    describe('non-nullable null', () => {
      const tests = [
        ['string 0 32', 'null', 'Invalid string: null', 'null'],
      ]
      for (const t of tests) {
        run_invalid(t)
      }
    })
  })

  describe('string in an object', () => {
    describe('object with 2 fields', () => {
      const tests = [
        [{"- olo":"string 0 2", "- bob":"string 0 2"}, '{}', {}, 'optional empty'],
        [{"- olo":"string 0 2", "- bob":"string 0 2"}, '{"olo":"ha"}', {olo: 2}, 'optional first'],
        [{"- olo":"string 0 2", "- bob":"string 0 2"}, '{"bob":"ha"}', {bob: 2}, 'optional second'],
        [{"+ olo":"string 0 2", "+ bob":"string 0 2"}, '{"olo":"ha","bob":"l"}', {olo: 2, bob: 1}, 'required both'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

    describe('object valid', () => {
      const tests = [
        [{}, '{}', {}, 'empty'],
        [{"- olo":"string 0 2"}, '{}', {}, 'optional empty'],
        [{"- olo":"string 0 2"}, '{"olo":"ha"}', {olo: 2}, 'optional full'],
        [{"+ olo":"string 0 2"}, '{"olo":"ha"}', {olo: 2}, 'required full'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

    describe('?object valid', () => {
      const tests = [
        [{"?":true}, '{}', {}, 'empty'],
        [{"?":true, "- olo":"string 0 2"}, '{}', {}, 'optional empty'],
        [{"?":true, "- olo":"string 0 2"}, '{"olo":"ha"}', {olo: 2}, 'optional full'],
        [{"?":true, "+ olo":"string 0 2"}, '{"olo":"ha"}', {olo: 2}, 'required full'],

        [{"?":true}, 'null', null, 'null'],
        [{"?":true, "- olo":"string 0 2"}, 'null', null, 'optional null'],
        [{"?":true, "+ olo":"string 0 2"}, 'null', null, 'required null'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

  })

  describe('string in an array', () => {
    describe('array valid', () => {
      const tests = [
        [['string 1 2', '0 0'], '[]', [], '0 0 empty'],
        [['string 1 2', '0 1'], '[]', [], '0 1 empty'],
        [['string 1 2', '1 1'], '["a"]', [1], '1 1 a'],
        [['string 1 2', '0 1'], '["a"]', [1], '0 1 a'],
        [['string 1 2', '1 2'], '["a"]', [1], '1 2 a'],
        [['string 1 2', '0 2'], '["a"]', [1], '0 2 a'],
        [['string 1 2', '2 2'], '["b","cc"]', [1,2], '2 2 bc'],
        [['string 1 2', '1 2'], '["b","cc"]', [1,2], '1 2 bc'],
        [['string 1 2', '2 3'], '["b","cc"]', [1,2], '2 3 bc'],
        [['string 1 2', '1 3'], '["b","cc"]', [1,2], '1 3 bc'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

    describe('?array valid', () => {
      const tests = [
        [['?', 'string 1 2', '0 0'], '[]', [], '0 0 empty'],
        [['?', 'string 1 2', '0 1'], '[]', [], '0 1 empty'],
        [['?', 'string 1 2', '1 1'], '["a"]', [1], '1 1 a'],
        [['?', 'string 1 2', '0 1'], '["a"]', [1], '0 1 a'],
        [['?', 'string 1 2', '1 2'], '["a"]', [1], '1 2 a'],
        [['?', 'string 1 2', '0 2'], '["a"]', [1], '0 2 a'],
        [['?', 'string 1 2', '2 2'], '["bb","c"]', [2,1], '2 2 bc'],
        [['?', 'string 1 2', '1 2'], '["bb","c"]', [2,1], '1 2 bc'],
        [['?', 'string 1 2', '2 3'], '["bb","c"]', [2,1], '2 3 bc'],
        [['?', 'string 1 2', '1 3'], '["bb","c"]', [2,1], '1 3 bc'],

        [['?', 'string 1 2', '0 0'], 'null', null, '0 0 null'],
        [['?', 'string 1 2', '0 1'], 'null', null, '0 1 null'],
        [['?', 'string 1 2', '5 5'], 'null', null, '5 5 null'],
        [['?', 'string 1 2', '5 6'], 'null', null, '5 6 null'],
      ]
      for (const t of tests) {
        run_valid(t)
      }
    })

  })

  describe('various cases', () => {
    it('not an object', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_parser_functions(null)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: object, found: null')
      }
    })

    it('not a function', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_parser_functions({
          'key': [],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: function, found: array')
      }
    })
  })

})
