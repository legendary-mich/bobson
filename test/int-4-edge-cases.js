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

describe('int_4 edge cases', () => {
  before(() => {
    bobson = new Bobson_Builder()
  })

  describe('valid', () => {
    const tests = [
      ['int_4 min max', '"-2147483648"', -2147483648, 'min'],
      ['int_4 min max', '"2147483647"', 2147483647, 'max'],
      ['int_4 -10 10', '"-10"', -10, '-10 10 -10'],
      ['int_4 -10 10', '"10"', 10, '-10 10 10'],
      ['int_4 -10 10', '"0"', 0, '-10 10 0'],
      ['int_4 -10 -10', '"-10"', -10, '-10 -10 -10'],
      ['int_4 10 10', '"10"', 10, '10 10 10'],
      ['int_4 0 0', '"0"', 0, '0 0 0'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?valid', () => {
    const tests = [
      ['?int_4 min max', '"-2147483648"', -2147483648, 'min'],
      ['?int_4 min max', '"2147483647"', 2147483647, 'max'],
      ['?int_4 -10 10', '"-10"', -10, '-10 10 -10'],
      ['?int_4 -10 10', '"10"', 10, '-10 10 10'],
      ['?int_4 -10 10', '"0"', 0, '-10 10 0'],
      ['?int_4 -10 -10', '"-10"', -10, '-10 -10 -10'],
      ['?int_4 10 10', '"10"', 10, '10 10 10'],
      ['?int_4 0 0', '"0"', 0, '0 0 0'],

      ['?int_4 min max', 'null', null, 'min max null'],
      ['?int_4 0 0', 'null', null, '0 0 null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      ['int_4 min max', '"a"', 'Invalid int_4: does not match regex', 'a'],
      ['int_4 min max', '"2a"', 'Invalid int_4: does not match regex', '2a'],
      ['int_4 min max', '"2.2"', 'Invalid int_4: does not match regex', '2.2'],
      ['int_4 min max', '"01"', 'Invalid int_4: does not match regex', '01'],
      ['int_4 min max', '"-0"', 'Invalid int_4: does not match regex', '-0'],
      ['int_4 min max', '"-"', 'Invalid int_4: does not match regex', '-'],
      ['int_4 min max', '"aaaaaaaaaaaa"', 'Invalid int_4: too long', 'too long a'],
      ['int_4 min max', '"-21474836480"', 'Invalid int_4: too long', 'too long -'],
      ['int_4 min max', '"214748364800"', 'Invalid int_4: too long', 'too long +'],
      ['int_4 0 0', '"-1"', 'Invalid int_4: too long', 'too long -1'],
      ['int_4 min max', '"-2147483649"', 'Invalid int_4: too small', 'too small min'],
      ['int_4 min max', '"2147483648"', 'Invalid int_4: too big', 'too big max'],
      ['int_4 -10 10', '"-11"', 'Invalid int_4: too small', 'too small -11'],
      ['int_4 -10 10', '"11"', 'Invalid int_4: too big', 'too big 11'],
      ['int_4 0 0', '"1"', 'Invalid int_4: too big', 'too big 1'],

      ['int_4 -10 10', 'null', 'Invalid int_4: null', 'non-nullable null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?invalid', () => {
    const tests = [
      ['?int_4 min max', '"a"', 'Invalid ?int_4: does not match regex', 'a'],
      ['?int_4 min max', '"2a"', 'Invalid ?int_4: does not match regex', '2a'],
      ['?int_4 min max', '"2.2"', 'Invalid ?int_4: does not match regex', '2.2'],
      ['?int_4 min max', '"01"', 'Invalid ?int_4: does not match regex', '01'],
      ['?int_4 min max', '"-0"', 'Invalid ?int_4: does not match regex', '-0'],
      ['?int_4 min max', '"-"', 'Invalid ?int_4: does not match regex', '-'],
      ['?int_4 min max', '"aaaaaaaaaaaa"', 'Invalid ?int_4: too long', 'too long a'],
      ['?int_4 min max', '"-21474836480"', 'Invalid ?int_4: too long', 'too long -'],
      ['?int_4 min max', '"214748364800"', 'Invalid ?int_4: too long', 'too long +'],
      ['?int_4 0 0', '"-1"', 'Invalid ?int_4: too long', 'too long -1'],
      ['?int_4 min max', '"-2147483649"', 'Invalid ?int_4: too small', 'too small min'],
      ['?int_4 min max', '"2147483648"', 'Invalid ?int_4: too big', 'too big max'],
      ['?int_4 -10 10', '"-11"', 'Invalid ?int_4: too small', 'too small -11'],
      ['?int_4 -10 10', '"11"', 'Invalid ?int_4: too big', 'too big 11'],
      ['?int_4 0 0', '"1"', 'Invalid ?int_4: too big', 'too big 1'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
