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

describe('int_8 edge cases', () => {
  describe('valid', () => {
    const tests = [
      ['int_8 min max', '"-9223372036854775808"', -9223372036854775808n, 'min'],
      ['int_8 min max', '"9223372036854775807"', 9223372036854775807n, 'max'],
      ['int_8 -10 10', '"-10"', -10n, '-10 10 -10'],
      ['int_8 -10 10', '"10"', 10n, '-10 10 10'],
      ['int_8 -10 10', '"0"', 0n, '-10 10 0'],
      ['int_8 -10 -10', '"-10"', -10n, '-10 -10 -10'],
      ['int_8 10 10', '"10"', 10n, '10 10 10'],
      ['int_8 0 0', '"0"', 0n, '0 0 0'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?valid', () => {
    const tests = [
      ['?int_8 min max', '"-9223372036854775808"', -9223372036854775808n, 'min'],
      ['?int_8 min max', '"9223372036854775807"', 9223372036854775807n, 'max'],
      ['?int_8 -10 10', '"-10"', -10n, '-10 10 -10'],
      ['?int_8 -10 10', '"10"', 10n, '-10 10 10'],
      ['?int_8 -10 10', '"0"', 0n, '-10 10 0'],
      ['?int_8 -10 -10', '"-10"', -10n, '-10 -10 -10'],
      ['?int_8 10 10', '"10"', 10n, '10 10 10'],
      ['?int_8 0 0', '"0"', 0n, '0 0 0'],

      ['?int_8 min max', 'null', null, 'min max null'],
      ['?int_8 0 0', 'null', null, '0 0 null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      ['int_8 min max', '"a"', 'Invalid int_8: does not match regex', 'a'],
      ['int_8 min max', '"2a"', 'Invalid int_8: does not match regex', '2a'],
      ['int_8 min max', '"2.2"', 'Invalid int_8: does not match regex', '2.2'],
      ['int_8 min max', '"01"', 'Invalid int_8: does not match regex', '01'],
      ['int_8 min max', '"-0"', 'Invalid int_8: does not match regex', '-0'],
      ['int_8 min max', '"-"', 'Invalid int_8: does not match regex', '-'],
      ['int_8 min max', '"aaaaaaaaaaaaaaaaaaaaa"', 'Invalid int_8: too long', 'too long a'],
      ['int_8 min max', '"-92233720368547758080"', 'Invalid int_8: too long', 'too long -'],
      ['int_8 min max', '"922337203685477580700"', 'Invalid int_8: too long', 'too long +'],
      ['int_8 0 0', '"-1"', 'Invalid int_8: too long', 'too long -1'],
      ['int_8 min max', '"-9223372036854775809"', 'Invalid int_8: too small', 'too small min'],
      ['int_8 min max', '"9223372036854775808"', 'Invalid int_8: too big', 'too big max'],
      ['int_8 -10 10', '"-11"', 'Invalid int_8: too small', 'too small -11'],
      ['int_8 -10 10', '"11"', 'Invalid int_8: too big', 'too big 11'],
      ['int_8 0 0', '"1"', 'Invalid int_8: too big', 'too big 1'],

      ['int_8 -10 10', 'null', 'Invalid int_8: null', 'non-nullable null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?invalid', () => {
    const tests = [
      ['?int_8 min max', '"a"', 'Invalid ?int_8: does not match regex', 'a'],
      ['?int_8 min max', '"2a"', 'Invalid ?int_8: does not match regex', '2a'],
      ['?int_8 min max', '"2.2"', 'Invalid ?int_8: does not match regex', '2.2'],
      ['?int_8 min max', '"01"', 'Invalid ?int_8: does not match regex', '01'],
      ['?int_8 min max', '"-0"', 'Invalid ?int_8: does not match regex', '-0'],
      ['?int_8 min max', '"-"', 'Invalid ?int_8: does not match regex', '-'],
      ['?int_8 min max', '"aaaaaaaaaaaaaaaaaaaaa"', 'Invalid ?int_8: too long', 'too long a'],
      ['?int_8 min max', '"-92233720368547758080"', 'Invalid ?int_8: too long', 'too long -'],
      ['?int_8 min max', '"922337203685477580700"', 'Invalid ?int_8: too long', 'too long +'],
      ['?int_8 0 0', '"-1"', 'Invalid ?int_8: too long', 'too long -1'],
      ['?int_8 min max', '"-9223372036854775809"', 'Invalid ?int_8: too small', 'too small min'],
      ['?int_8 min max', '"9223372036854775808"', 'Invalid ?int_8: too big', 'too big max'],
      ['?int_8 -10 10', '"-11"', 'Invalid ?int_8: too small', 'too small -11'],
      ['?int_8 -10 10', '"11"', 'Invalid ?int_8: too big', 'too big 11'],
      ['?int_8 0 0', '"1"', 'Invalid ?int_8: too big', 'too big 1'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
