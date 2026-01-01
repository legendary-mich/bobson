'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
let bobson

describe('prototype pollution', () => {
  before(() => {
    bobson = new Bobson_Builder()
  })

  it('proto is not defined in the schema', () => {
    const p = bobson.get_parser(["object", {
      "- name": "string 0 10",
    }])
    try {
      p.parse('{"__proto__":"aa"}')
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq(err.message, 'Unknown key found: __proto__')
    }
  })

  it('proto is required', () => {
    const p = bobson.get_parser(["object", {
      "+ __proto__": "string 0 10",
    }])
    try {
      p.parse('{"__proto__":"aa"}')
      throw new Error('should have thrown')
    }
    catch (err) {
      // Throws because Object.hasOwn cannot find it.
      deepEq(err.message, 'Invalid object: missing required field: __proto__')
    }
  })

  it('proto is optional. DANGEROUS as the __proto__ can be hijacked', () => {
    const p = bobson.get_parser(["object", {
      "- __proto__": ["object", {
        "+ authorized": "bool",
      }],
      "+ name": "string 0 10",
    }])
    const result = p.parse('{"__proto__":{"authorized":"true"},"name":"bo"}')
    deepEq(result, {name: 'bo'})
    deepEq(result.authorized, true)
  })
})
