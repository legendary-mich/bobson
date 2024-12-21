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
      [["object",{"- olo":["object",{}]}], '{}', {}, 'optional empty'],
      [["object",{"- olo":["object",{}]}], '{"olo":{}}', {olo:{}}, 'optional full'],
      [["object",{"+ olo":["object",{}]}], '{"olo":{}}', {olo:{}}, 'required full'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?object valid', () => {
    const tests = [
      [["object",{"- olo":["?object",{}]}], '{}', {}, 'optional empty'],
      [["object",{"- olo":["?object",{}]}], '{"olo":{}}', {olo:{}}, 'optional full'],
      [["object",{"+ olo":["?object",{}]}], '{"olo":{}}', {olo:{}}, 'required full'],

      [["object",{"- olo":["?object",{}]}], '{"olo":null}', {olo:null}, 'optional null'],
      [["object",{"+ olo":["?object",{}]}], '{"olo":null}', {olo:null}, 'required null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('too many fields', () => {
    const tests = [
      [["object",{"+ i":["object",{}]}], '{"i":{"bobo":"ho"}}', 'Unknown key found: bobo', 'empty'],
      [["object",{"+ i":["object",{"+ bobo": "string 0 2"}]}], '{"i":{"bobo":"ho","roko":"zo"}}',
        'Unknown key found: roko', 'single field'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('missing a required field', () => {
    const tests = [
      [["object",{"+ i":["object",{"+ bobo": "string 0 2"}]}], '{"i":{}}',
        'Invalid object: missing required field: bobo', 'missing bobo'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('non-nullable null', () => {
    const tests = [
      [["object",{"+ i":["object",{}]}], '{"i":null}', 'Invalid object: null', 'recursive empty'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid string inside an object', () => {
    const tests = [
      [["object",{"+ a":["object",{"+ i":"string 1 2"}]}], '{"a":{"i":"abc"}}', 'Invalid string: too long', 'too long'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
