'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_parser_functions({
  custom_1:(s)=>s.length,
  custom_2:(s)=>s+s,
})
bobson.add_derived_types({
  custom_1: 'string 0 4',
  custom_2: 'int_4 0 100',
  custom_3: 'custom_2',
})

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

describe('custom derived type parsers', () => {

  describe('valid', () => {
    const tests = [
      ['custom_1', '"bobo"', 4, 'custom 1 bobo'],
      ['custom_2', '"23"', '2323', 'custom 2 23'],
      ['custom_3', '"23"', '2323', 'custom 3 23'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?valid', () => {
    const tests = [
      ['?custom_1', '"bobo"', 4, 'custom 1 bobo'],
      ['?custom_2', '"23"', '2323', 'custom 2 23'],
      ['?custom_1', 'null', null, 'custom 1 null'],
      ['?custom_2', 'null', null, 'custom 2 null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      ['custom_1', '"bobol"', 'Invalid custom_1: too long', 'custom 1 bobol'],
      ['custom_2', '"233"', 'Invalid custom_2: too big', 'custom 2 233'],
      ['custom_1', 'null', 'Invalid custom_1: null', 'custom 1 null'],
      ['custom_2', 'null', 'Invalid custom_2: null', 'custom 2 null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?invalid', () => {
    const tests = [
      ['?custom_2', '"233"', 'Invalid ?custom_2: too big', 'custom 2 233'],
      ['?custom_1', '"bobol"', 'Invalid ?custom_1: too long', 'custom 1 bobol'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

})
