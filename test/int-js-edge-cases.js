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

describe('int_js edge cases', () => {
  before(() => {
    bobson = new Bobson_Builder()
  })

  describe('valid', () => {
    const tests = [
      ['int_js min max', '"-9007199254740991"', -9007199254740991, 'min'],
      ['int_js min max', '"9007199254740991"', 9007199254740991, 'max'],
      ['int_js -10 10', '"-10"', -10, '-10 10 -10'],
      ['int_js -10 10', '"10"', 10, '-10 10 10'],
      ['int_js -10 10', '"0"', 0, '-10 10 0'],
      ['int_js -10 -10', '"-10"', -10, '-10 -10 -10'],
      ['int_js 10 10', '"10"', 10, '10 10 10'],
      ['int_js 0 0', '"0"', 0, '0 0 0'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?valid', () => {
    const tests = [
      ['?int_js min max', '"-9007199254740991"', -9007199254740991, 'min'],
      ['?int_js min max', '"9007199254740991"', 9007199254740991, 'max'],
      ['?int_js -10 10', '"-10"', -10, '-10 10 -10'],
      ['?int_js -10 10', '"10"', 10, '-10 10 10'],
      ['?int_js -10 10', '"0"', 0, '-10 10 0'],
      ['?int_js -10 -10', '"-10"', -10, '-10 -10 -10'],
      ['?int_js 10 10', '"10"', 10, '10 10 10'],
      ['?int_js 0 0', '"0"', 0, '0 0 0'],

      ['?int_js min max', 'null', null, 'min max null'],
      ['?int_js 0 0', 'null', null, '0 0 null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      ['int_js min max', '"a"', 'Invalid int_js: does not match regex', 'a'],
      ['int_js min max', '"2a"', 'Invalid int_js: does not match regex', '2a'],
      ['int_js min max', '"2.2"', 'Invalid int_js: does not match regex', '2.2'],
      ['int_js min max', '"01"', 'Invalid int_js: does not match regex', '01'],
      ['int_js min max', '"-0"', 'Invalid int_js: does not match regex', '-0'],
      ['int_js min max', '"-"', 'Invalid int_js: does not match regex', '-'],
      ['int_js min max', '"aaaaaaaaaaaaaaaaaa"', 'Invalid int_js: too long', 'too long a'],
      ['int_js min max', '"-90071992547409910"', 'Invalid int_js: too long', 'too long -'],
      ['int_js min max', '"900719925474099100"', 'Invalid int_js: too long', 'too long +'],
      ['int_js 0 0', '"-1"', 'Invalid int_js: too long', 'too long -1'],
      ['int_js min max', '"-9007199254740992"', 'Invalid int_js: too small', 'too small min'],
      ['int_js min max', '"9007199254740992"', 'Invalid int_js: too big', 'too big max'],
      ['int_js -10 10', '"-11"', 'Invalid int_js: too small', 'too small -11'],
      ['int_js -10 10', '"11"', 'Invalid int_js: too big', 'too big 11'],
      ['int_js 0 0', '"1"', 'Invalid int_js: too big', 'too big 1'],

      ['int_js -10 10', 'null', 'Invalid int_js: null', 'non-nullable null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?invalid', () => {
    const tests = [
      ['?int_js min max', '"a"', 'Invalid ?int_js: does not match regex', 'a'],
      ['?int_js min max', '"2a"', 'Invalid ?int_js: does not match regex', '2a'],
      ['?int_js min max', '"2.2"', 'Invalid ?int_js: does not match regex', '2.2'],
      ['?int_js min max', '"01"', 'Invalid ?int_js: does not match regex', '01'],
      ['?int_js min max', '"-0"', 'Invalid ?int_js: does not match regex', '-0'],
      ['?int_js min max', '"-"', 'Invalid ?int_js: does not match regex', '-'],
      ['?int_js min max', '"aaaaaaaaaaaaaaaaaa"', 'Invalid ?int_js: too long', 'too long a'],
      ['?int_js min max', '"-90071992547409910"', 'Invalid ?int_js: too long', 'too long -'],
      ['?int_js min max', '"900719925474099100"', 'Invalid ?int_js: too long', 'too long +'],
      ['?int_js 0 0', '"-1"', 'Invalid ?int_js: too long', 'too long -1'],
      ['?int_js min max', '"-9007199254740992"', 'Invalid ?int_js: too small', 'too small min'],
      ['?int_js min max', '"9007199254740992"', 'Invalid ?int_js: too big', 'too big max'],
      ['?int_js -10 10', '"-11"', 'Invalid ?int_js: too small', 'too small -11'],
      ['?int_js -10 10', '"11"', 'Invalid ?int_js: too big', 'too big 11'],
      ['?int_js 0 0', '"1"', 'Invalid ?int_js: too big', 'too big 1'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
