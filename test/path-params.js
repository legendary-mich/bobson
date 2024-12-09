'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()

function run_valid(t) {
  it(t[3], () => {
    const result = bobson.parse_path_params(t[0], t[1])
    deepEq(result, t[2])
  })
}

function run_invalid(t) {
  it(t[3], () => {
    try {
      bobson.parse_path_params(t[0], t[1])
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq(err.message, t[2])
    }
  })
}

describe('path params', () => {

  describe('valid', () => {
    const tests = [
      [{}, {}, {}, 'empty'],
      [{"- name":"string 1 10"}, {}, {}, 'empty optional'],
      [{"+ name":"string 1 10"}, {name:'ryan'}, {name:'ryan'}, 'name:ryan'],
      [{"+ name":"string 1 10","+ id":"int_js 0 9"},
        {name:'ryan',id:'7'}, {name:'ryan', id: 7}, 'name:ryan, id:7'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      [undefined,
        {}, 'Unknown schema type: undefined', 'undefined schema'],
      [{"+ name":"string 1 10","+ id":"int_js 0 9"},
        null, 'Invalid Type. Expected: object, found: null', 'null params'],
      [{"+ name":"string 1 10","+ id":"int_js 0 9"},
        {}, 'Invalid object: missing required field: name', 'empty object'],
      [{"+ name":"string 1 10","+ id":"int_js 0 9"},
        {id:'7'}, 'Invalid object: missing required field: name', 'missing required name'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
