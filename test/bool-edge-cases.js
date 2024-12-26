'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
let bobson

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

describe('bool edge cases', () => {
  before(() => {
    console.log('before')
    bobson = new Bobson_Builder()
  })

  describe('bool valid', () => {
    const tests = [
      ['bool', '"true"', true, 'true'],
      ['bool', '"false"', false, 'false'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?bool valid', () => {
    const tests = [
      ['?bool', '"true"', true, 'true'],
      ['?bool', '"false"', false, 'false'],
      ['?bool', 'null', null, 'null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('bool invalid', () => {
    const tests = [
      ['bool', '"tru"', 'Invalid bool: too short', 'tru'],
      ['bool', '"trueee"', 'Invalid bool: too long', 'trueee'],
      ['bool', '"truce"', 'Invalid bool: truce', 'truce'],
      ['bool', '"falce"', 'Invalid bool: falce', 'falce'],
      ['bool', 'null', 'Invalid bool: null', 'null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?bool invalid', () => {
    const tests = [
      ['?bool', '"tru"', 'Invalid ?bool: too short', 'tru'],
      ['?bool', '"trueee"', 'Invalid ?bool: too long', 'trueee'],
      ['?bool', '"truce"', 'Invalid ?bool: truce', 'truce'],
      ['?bool', '"falce"', 'Invalid ?bool: falce', 'falce'],

      ['?bool', 'nule', 'Invalid null literal. Expected: null, found: nule', 'nule'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
