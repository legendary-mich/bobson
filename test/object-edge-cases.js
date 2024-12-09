'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()

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

describe('object edge cases', () => {
  describe('object with 2 fields', () => {
    const tests = [
      [{"- olo":"string 0 2", "- bob":"string 0 2"}, '{}', {}, 'optional empty'],
      [{"- olo":"string 0 2", "- bob":"string 0 2"}, '{"olo":"ha"}', {olo: 'ha'}, 'optional first'],
      [{"- olo":"string 0 2", "- bob":"string 0 2"}, '{"bob":"ha"}', {bob: 'ha'}, 'optional second'],
      [{"+ olo":"string 0 2", "+ bob":"string 0 2"}, '{"olo":"ha","bob":"li"}', {olo: 'ha', bob: 'li'}, 'required both'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('object valid', () => {
    const tests = [
      [{}, '{}', {}, 'empty'],
      [{"- olo":"string 0 2"}, '{}', {}, 'optional empty'],
      [{"- olo":"string 0 2"}, '{"olo":"ha"}', {olo: 'ha'}, 'optional full'],
      [{"+ olo":"string 0 2"}, '{"olo":"ha"}', {olo: 'ha'}, 'required full'],
      [{"?":false, "- olo":"string 0 2"}, '{}', {}, '?:false'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?object valid', () => {
    const tests = [
      [{"?":true}, '{}', {}, 'empty'],
      [{"?":true, "- olo":"string 0 2"}, '{}', {}, 'optional empty'],
      [{"?":true, "- olo":"string 0 2"}, '{"olo":"ha"}', {olo: 'ha'}, 'optional full'],
      [{"?":true, "+ olo":"string 0 2"}, '{"olo":"ha"}', {olo: 'ha'}, 'required full'],

      [{"?":true}, 'null', null, 'null'],
      [{"?":true, "- olo":"string 0 2"}, 'null', null, 'optional null'],
      [{"?":true, "+ olo":"string 0 2"}, 'null', null, 'required null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('too many fields', () => {
    const tests = [
      [{}, '{"bobo":"ho"}', 'Unknown key found: bobo', 'empty'],
      [{"+ bobo": "string 0 2"}, '{"bobo":"ho","roko":"zo"}',
        'Unknown key found: roko', 'single field'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('missing a required field', () => {
    const tests = [
      [{"+ bobo": "string 0 2"}, '{}',
        'Invalid object: missing required field: bobo', 'missing bobo'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('duplicate field', () => {
    const tests = [
      [{"+ bobo": "string 0 2"}, '{"bobo":"ho","bobo":"ha"}',
        'Duplicate key found: bobo', 'duplicate field bobo'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('non-nullable null', () => {
    const tests = [
      [{}, 'null', 'Invalid object: null', 'empty'],
      [{"?":false}, 'null', 'Invalid object: null', 'empty'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid string inside an object', () => {
    const tests = [
      [{"+ i":"string 1 2"}, '{"i":"abc"}', 'Invalid string: too long', 'too long'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('malformed object', () => {
    const tests = [
      [{}, '{', 'Incomplete payload. Some characters are missing at the end', 'missing end'],
      [{}, '}', 'Invalid object opening char. Expected: {, found: }', 'missing start'],
      [{"- bo":"string 0 1"}, '{"bo":"a",}', 'Invalid string opening char. Expected: ", found: }', 'redundant comma'],
      [{"- bo":"string 0 1"}, '{"bo":}', 'Invalid string opening char. Expected: ", found: }', 'missing value'],
      [{"- bo":"string 0 1"}, '{"bo"}', 'Invalid object member-colon. Expected: :, found: }', 'missing colon'],
      [{"- bo":"string 0 1"}, '{"bo":"a"b}', 'Invalid object enclosing char. Expected: , or }, found: b', 'missing comma'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('malformed ?object', () => {
    const tests = [
      [{"?":true}, '{', 'Incomplete payload. Some characters are missing at the end', 'missing end'],
      [{"?":true}, '}', 'Invalid object opening char. Expected: {, found: }', 'missing start'],
      [{"?":true, "- bo":"string 0 1"}, '{"bo":"a",}', 'Invalid string opening char. Expected: ", found: }', 'redundant comma'],
      [{"?":true, "- bo":"string 0 1"}, '{"bo":}', 'Invalid string opening char. Expected: ", found: }', 'missing value'],
      [{"?":true, "- bo":"string 0 1"}, '{"bo"}', 'Invalid object member-colon. Expected: :, found: }', 'missing colon'],
      [{"?":true, "- bo":"string 0 1"}, '{"bo":"a"b}', 'Invalid object enclosing char. Expected: , or }, found: b', 'missing comma'],

      [{"?":true, "- bo":"string 0 1"}, 'bull', 'Invalid object opening char. Expected: {, found: b', 'bull'],
      [{"?":true, "- bo":"string 0 1"}, 'nulb', 'Invalid null literal. Expected: null, found: nulb', 'nulb'],
      [{"?":true, "- bo":"string 0 1"}, 'nul', 'Incomplete payload. Some characters are missing at the end', 'nul'],
      [{"?":true, "- bo":"string 0 1"}, 'nulll', 'Parser has already finished. There are redundant characters after the enclosing char', 'nulll'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('valid with all types', () => {
    const tests = [
      [{"- olo":"string 0 2"}, '{}', {}, 'string optional empty'],
      [{"- olo":"string 0 2"}, '{"olo":"ha"}', {olo: 'ha'}, 'string optional full'],
      [{"+ olo":"string 0 2"}, '{"olo":"ha"}', {olo: 'ha'}, 'string required full'],
      [{"- olo":"?string 0 2"}, '{}', {}, '?string optional empty'],
      [{"- olo":"?string 0 2"}, '{"olo":"ha"}', {olo: 'ha'}, '?string optional full'],
      [{"+ olo":"?string 0 2"}, '{"olo":"ha"}', {olo: 'ha'}, '?string required full'],
      [{"- olo":"?string 0 2"}, '{"olo":null}', {olo: null}, '?string optional null'],
      [{"+ olo":"?string 0 2"}, '{"olo":null}', {olo: null}, '?string required null'],

      [{"- olo":"enum bo"}, '{}', {}, 'enum optional empty'],
      [{"- olo":"enum bo"}, '{"olo":"bo"}', {olo: 'bo'}, 'enum optional full'],
      [{"+ olo":"enum bo"}, '{"olo":"bo"}', {olo: 'bo'}, 'enum required full'],
      [{"- olo":"?enum bo"}, '{}', {}, '?string optional empty'],
      [{"- olo":"?enum bo"}, '{"olo":"bo"}', {olo: 'bo'}, '?enum optional full'],
      [{"+ olo":"?enum bo"}, '{"olo":"bo"}', {olo: 'bo'}, '?enum required full'],
      [{"- olo":"?enum bo"}, '{"olo":null}', {olo: null}, '?enum optional null'],
      [{"+ olo":"?enum bo"}, '{"olo":null}', {olo: null}, '?enum required null'],

      [{"- olo":["string 0 2", "0 2"]}, '{}', {}, 'array optional empty'],
      [{"- olo":["string 0 2", "0 2"]}, '{"olo":[]}', {olo: []}, 'array optional full'],
      [{"+ olo":["string 0 2", "0 2"]}, '{"olo":[]}', {olo: []}, 'array required full'],
      [{"- olo":["?", "string 0 2", "0 2"]}, '{}', {}, '?array optional empty'],
      [{"- olo":["?", "string 0 2", "0 2"]}, '{"olo":[]}', {olo: []}, '?array optional full'],
      [{"+ olo":["?", "string 0 2", "0 2"]}, '{"olo":[]}', {olo: []}, '?array required full'],
      [{"- olo":["?", "string 0 2", "0 2"]}, '{"olo":null}', {olo: null}, '?array optional null'],
      [{"+ olo":["?", "string 0 2", "0 2"]}, '{"olo":null}', {olo: null}, '?array required null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('missing a required field with all types', () => {
    const tests = [
      [{"+ bobo": "string 0 2"}, '{}', 'Invalid object: missing required field: bobo', 'missing bobo'],
      [{"+ bobo": "enum ac"}, '{}', 'Invalid object: missing required field: bobo', 'missing bobo'],
      [{"+ bobo": ["string 0 2", "0 2"]}, '{}', 'Invalid object: missing required field: bobo', 'missing bobo'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
