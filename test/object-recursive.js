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

describe('object recursive', () => {
  describe('object valid', () => {
    const tests = [
      [{"- olo":{}}, '{}', {}, 'optional empty'],
      [{"- olo":{}}, '{"olo":{}}', {olo:{}}, 'optional full'],
      [{"+ olo":{}}, '{"olo":{}}', {olo:{}}, 'required full'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?object valid', () => {
    const tests = [
      [{"- olo":{"?":true}}, '{}', {}, 'optional empty'],
      [{"- olo":{"?":true}}, '{"olo":{}}', {olo:{}}, 'optional full'],
      [{"+ olo":{"?":true}}, '{"olo":{}}', {olo:{}}, 'required full'],

      [{"- olo":{"?":true}}, '{"olo":null}', {olo:null}, 'optional null'],
      [{"+ olo":{"?":true}}, '{"olo":null}', {olo:null}, 'required null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('too many fields', () => {
    const tests = [
      [{"+ i":{}}, '{"i":{"bobo":"ho"}}', 'Unknown key found: bobo', 'empty'],
      [{"+ i":{"+ bobo": "string 0 2"}}, '{"i":{"bobo":"ho","roko":"zo"}}',
        'Unknown key found: roko', 'single field'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('missing a required field', () => {
    const tests = [
      [{"+ i":{"+ bobo": "string 0 2"}}, '{"i":{}}',
        'Invalid object: missing required field: bobo', 'missing bobo'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('non-nullable null', () => {
    const tests = [
      [{"+ i":{}}, '{"i":null}', 'Invalid object: null', 'recursive empty'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid string inside an object', () => {
    const tests = [
      [{"+ a":{"+ i":"string 1 2"}}, '{"a":{"i":"abc"}}', 'Invalid string: too long', 'too long'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
