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

describe('decimal edge cases', () => {
  before(() => {
    bobson = new Bobson_Builder()
  })

  describe('valid positive', () => {
    const tests = [
      ['decimal 0 0', '"0"', '0', '0 0 0'],
      ['decimal 0 1', '"0"', '0', '0 1 0'],
      ['decimal 0 1', '"1"', '1', '0 1 1'],
      ['decimal 0 2', '"0"', '0', '0 2 0'],
      ['decimal 0 2', '"1"', '1', '0 2 1'],
      ['decimal 0 2', '"2"', '2', '0 2 2'],
      ['decimal 1 20', '"3"', '3', '1 20 3'],
      ['decimal 3 20', '"10"', '10', '3 20 10'],
      ['decimal 10 20', '"10"', '10', '10 20 10'],
      ['decimal 10 20', '"11"', '11', '10 20 11'],
      ['decimal 10 20', '"19"', '19', '10 20 19'],
      ['decimal 10 20', '"20"', '20', '10 20 20'],
      ['decimal 100 200', '"200"', '200', '100 200 200'],

      ['decimal 0.0 0.0', '"0.0"', '0.0', '0.0 0.0 0.0'],
      ['decimal 0.0 0.1', '"0.0"', '0.0', '0.0 0.1 0.0'],
      ['decimal 0.0 0.1', '"0.1"', '0.1', '0.0 0.1 0.1'],
      ['decimal 0.0 0.2', '"0.0"', '0.0', '0.0 0.2 0.0'],
      ['decimal 0.0 0.2', '"0.1"', '0.1', '0.0 0.2 0.1'],
      ['decimal 0.00 0.20', '"0.19"', '0.19', '0.0 0.2 0.19'],
      ['decimal 0.0 0.2', '"0.2"', '0.2', '0.0 0.2 0.2'],
      ['decimal 10.10 20.20', '"10.10"', '10.10', '10.10 20.20 10.10'],
      ['decimal 10.10 20.20', '"10.11"', '10.11', '10.10 20.20 10.11'],
      ['decimal 10.10 20.20', '"10.2"', '10.2', '10.10 20.20 10.2'],
      ['decimal 10.10 20.20', '"20.19"', '20.19', '10.10 20.20 20.19'],
      ['decimal 10.100 20.200', '"20.199"', '20.199', '10.10 20.20 20.199'],
      ['decimal 10.10 20.20', '"20.20"', '20.20', '10.10 20.20 20.20'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?valid nullable', () => {
    const tests = [
      ['?decimal 3 20', '"10"', '10', '3 20 10'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('valid negative', () => {
    const tests = [
      ['decimal -1 0', '"-1"', '-1', '-1 0 -1'],
      ['decimal -1 0', '"0"', '0', '-1 0 0'],
      ['decimal -2 0', '"-2"', '-2', '-2 0 -2'],
      ['decimal -2.00 0.00', '"-1.99"', '-1.99', '-2 0 -1.99'],
      ['decimal -2.000 0.000', '"-0.002"', '-0.002', '-2 0 -0.002'],
      ['decimal -2.000 0.000', '"-0.900"', '-0.900', '-2 0 -1.900'],
      ['decimal -2 0', '"-1"', '-1', '-2 0 -1'],
      ['decimal -2 0', '"0"', '0', '-2 0 0'],
      ['decimal -30 -20', '"-30"', '-30', '-30 -20 -30'],
      ['decimal -30 -20', '"-29"', '-29', '-30 -20 -29'],
      ['decimal -30 -20', '"-21"', '-21', '-30 -20 -21'],
      ['decimal -30 -20', '"-20"', '-20', '-30 -20 -20'],
      ['decimal -30.0 -20.0', '"-29.9"', '-29.9', '-30 -20 -29.9'],
      ['decimal -300 -200', '"-200"', '-200', '-300 -200 -200'],

      ['decimal -30.10 -20.20', '"-30.10"', '-30.10', '-30.10 -20.20 -30.10'],
      ['decimal -30.10 -20.20', '"-30.09"', '-30.09', '-30.10 -20.20 -30.09'],
      ['decimal -30.100 -20.200', '"-30.099"', '-30.099', '-30.10 -20.20 -30.099'],
      ['decimal -30.10 -20.20', '"-20.21"', '-20.21', '-30.10 -20.20 -20.21'],
      ['decimal -30.10 -20.20', '"-20.20"', '-20.20', '-30.10 -20.20 -20.20'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('valid mixed', () => {
    const tests = [
      ['decimal -30.10 20.20', '"-30.10"', '-30.10', '-30.10 20.20 -30.10'],
      ['decimal -30.10 20.20', '"-30.09"', '-30.09', '-30.10 20.20 -30.09'],
      ['decimal -30.10 20.20', '"20.19"', '20.19', '-30.10 20.20 20.19'],
      ['decimal -30.10 20.20', '"20.20"', '20.20', '-30.10 20.20 20.20'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid too long', () => {
    const tests = [
      ['decimal 0 30', '"-20"', 'Invalid decimal: too long', '0 30 -20'],
      ['decimal 0 30', '"200"', 'Invalid decimal: too long', '0 30 200'],
      ['decimal -10 30', '"-200"', 'Invalid decimal: too long', '-10 30 -200'],
      ['decimal -10 30', '"2000"', 'Invalid decimal: too long', '-10 30 2000'],

      ['decimal 0.00 30.00', '"-20.00"', 'Invalid decimal: too long', '0.00 30.00 -20.00'],
      ['decimal 0.00 30.00', '"200.00"', 'Invalid decimal: too long', '0.00 30.00 200.00'],
      ['decimal -10.00 30.00', '"-200.00"', 'Invalid decimal: too long', '-10.00 30.00 -200.00'],
      ['decimal -10.00 30.00', '"2000.00"', 'Invalid decimal: too long', '-10.00 30.00 2000.00'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid too big', () => {
    const tests = [
      ['decimal -9 -3', '"-2"', 'Invalid decimal: too big', '-9 -3 -2'],
      ['decimal -9 -2', '"-1"', 'Invalid decimal: too big', '-9 -2 -1'],
      ['decimal -9 -1', '"0"', 'Invalid decimal: too big', '-9 -1 0'],
      ['decimal -9 0', '"1"', 'Invalid decimal: too big', '-9 0 1'],
      ['decimal -9 1', '"2"', 'Invalid decimal: too big', '-9 1 2'],
      ['decimal -9 2', '"3"', 'Invalid decimal: too big', '-9 2 3'],
      ['decimal 0 2', '"3"', 'Invalid decimal: too big', '0 2 3'],
      ['decimal 1 2', '"3"', 'Invalid decimal: too big', '1 2 3'],

      ['decimal -0.9 -0.3', '"-0.2"', 'Invalid decimal: too big', '-0.9 -0.3 -0.2'],
      ['decimal -0.9 -0.2', '"-0.1"', 'Invalid decimal: too big', '-0.9 -0.2 -0.1'],
      ['decimal -0.9 -0.1', '"0.0"', 'Invalid decimal: too big', '-0.9 -0.1 0.0'],
      ['decimal -0.9 0.0', '"0.1"', 'Invalid decimal: too big', '-0.9 0.0 0.1'],
      ['decimal -0.9 0.1', '"0.2"', 'Invalid decimal: too big', '-0.9 0.1 0.2'],
      ['decimal -0.9 0.2', '"0.3"', 'Invalid decimal: too big', '-0.9 0.2 0.3'],
      ['decimal 0.0 0.2', '"0.3"', 'Invalid decimal: too big', '0.0 0.2 0.3'],
      ['decimal 0.1 0.2', '"0.3"', 'Invalid decimal: too big', '0.1 0.2 0.3'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid too small', () => {
    const tests = [
      ['decimal 3 9', '"2"', 'Invalid decimal: too small', '3 9 2'],
      ['decimal 2 9', '"1"', 'Invalid decimal: too small', '2 9 1'],
      ['decimal 1 9', '"0"', 'Invalid decimal: too small', '1 9 0'],
      ['decimal 0 90', '"-1"', 'Invalid decimal: too small', '0 9 -1'],
      ['decimal -1 9', '"-2"', 'Invalid decimal: too small', '-1 9 -2'],
      ['decimal -2 9', '"-3"', 'Invalid decimal: too small', '-2 9 -3'],
      ['decimal -2 0', '"-3"', 'Invalid decimal: too small', '-2 0 -3'],
      ['decimal -2 -1', '"-3"', 'Invalid decimal: too small', '-2 -1 -3'],

      ['decimal 0.3 0.9', '"0.2"', 'Invalid decimal: too small', '0.3 0.9 0.2'],
      ['decimal 0.2 0.9', '"0.1"', 'Invalid decimal: too small', '0.2 0.9 0.1'],
      ['decimal 0.1 0.9', '"0.0"', 'Invalid decimal: too small', '0.1 0.9 0.0'],
      ['decimal 0.00 0.90', '"-0.1"', 'Invalid decimal: too small', '0.0 0.9 -0.1'],
      ['decimal -0.1 0.9', '"-0.2"', 'Invalid decimal: too small', '-0.1 0.9 -0.2'],
      ['decimal -0.2 0.9', '"-0.3"', 'Invalid decimal: too small', '-0.2 0.9 -0.3'],
      ['decimal -0.2 0.0', '"-0.3"', 'Invalid decimal: too small', '-0.2 0.0 -0.3'],
      ['decimal -0.2 -0.1', '"-0.3"', 'Invalid decimal: too small', '-0.2 -0.1 -0.3'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid fractional digits', () => {
    const tests = [
      ['decimal 3 9000', '"3.0"', 'Invalid decimal: fractional part too long', '3 9000 3.0'],
      ['decimal 3.2 9000.2', '"5.33"', 'Invalid decimal: fractional part too long', '3.2 9000.2 5.33'],
      ['decimal 3.2 9000.2', '"5.334"', 'Invalid decimal: fractional part too long', '3.2 9000.2 5.334'],
      ['decimal -30.2 9000.2', '"-5.34"', 'Invalid decimal: fractional part too long', '-30.2 9000.2 5.34'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid mixed', () => {
    const tests = [
      ['decimal -30.10 20.20', '"-30.12"', 'Invalid decimal: too small', '-30.10 20.20 -30.12'],
      ['decimal -30.10 20.20', '"-30.11"', 'Invalid decimal: too small', '-30.10 20.20 -30.11'],
      ['decimal -4.100 20.200', '"-30.11"', 'Invalid decimal: too small', '-4.10 20.20 -30.11'],

      ['decimal -30.10 20.20', '"20.21"', 'Invalid decimal: too big', '-30.10 20.20 20.21'],
      ['decimal -30.10 20.20', '"20.22"', 'Invalid decimal: too big', '-30.10 20.20 20.22'],
      ['decimal -30.10 1.20', '"20.22"', 'Invalid decimal: too big', '-30.10 20.20 20.22'],

      ['decimal -300 3', 'null', 'Invalid decimal: null', 'null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid malformed', () => {
    const tests = [
      ['decimal -300 3', '"a"', 'Invalid decimal: does not match regex', 'a'],
      ['decimal -300 3', '"-a"', 'Invalid decimal: does not match regex', '-a'],
      ['decimal -300 3', '"0a"', 'Invalid decimal: does not match regex', '0a'],
      ['decimal -300 3', '"1a"', 'Invalid decimal: does not match regex', '1a'],
      ['decimal -300 3', '"12a"', 'Invalid decimal: does not match regex', '12a'],
      ['decimal -300 3', '"0.a"', 'Invalid decimal: does not match regex', '0.a'],
      ['decimal -300 3', '"1.a"', 'Invalid decimal: does not match regex', '1.a'],
      ['decimal -300 3', '"1.0a"', 'Invalid decimal: does not match regex', '1.0a'],
      ['decimal -300 3', '"1.1a"', 'Invalid decimal: does not match regex', '1.1a'],

      ['decimal -300 3', '"."', 'Invalid decimal: does not match regex', '.'],
      ['decimal -300 3', '"-"', 'Invalid decimal: does not match regex', '-'],
      ['decimal -300 3', '"-."', 'Invalid decimal: does not match regex', '-.'],
      ['decimal -300 3', '"-0"', 'Invalid decimal: does not match regex', '-0'],
      ['decimal -300 3', '"-0."', 'Invalid decimal: does not match regex', '-0.'],
      ['decimal -300 3', '"-0.0"', 'Invalid decimal: does not match regex', '-0.0'],
      ['decimal -300000 3', '"-0.00"', 'Invalid decimal: does not match regex', '-0.00'],
      ['decimal -300000 3', '"a-0.01"', 'Invalid decimal: does not match regex', 'a-0.01'],
      ['decimal -300000 3', '"-0.01a"', 'Invalid decimal: does not match regex', '-0.01a'],
      ['decimal -300000 3', '"0."', 'Invalid decimal: does not match regex', '0.'],
      ['decimal -300000 3', '"0.1.0"', 'Invalid decimal: does not match regex', '0.'],
      ['decimal -300000 3', '"1."', 'Invalid decimal: does not match regex', '1.'],
      ['decimal -300000 3', '"1.1."', 'Invalid decimal: does not match regex', '1.1.'],
      ['decimal -300000 3', '"1.1.1"', 'Invalid decimal: does not match regex', '1.1.1'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
