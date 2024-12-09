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

describe('string edge cases', () => {
  describe('string valid', () => {
    const tests = [
      ['string 0 0', '""', '', '0 0 empty'],
      ['string 0 1', '""', '', '0 1 empty'],
      ['string 1 1', '"a"', 'a', '1 1 a'],
      ['string 0 1', '"a"', 'a', '0 1 a'],
      ['string 1 2', '"a"', 'a', '1 2 a'],
      ['string 0 2', '"a"', 'a', '0 2 a'],
      ['string 2 2', '"bc"', 'bc', '2 2 bc'],
      ['string 1 2', '"bc"', 'bc', '1 2 bc'],
      ['string 2 3', '"bc"', 'bc', '2 3 bc'],
      ['string 1 3', '"bc"', 'bc', '1 3 bc'],
      ['string 1 3 ^bc$', '"bc"', 'bc', '1 3 ^bc$'],
      ['string 0 3', '"b\\"c"', 'b"c', '0 3 b"c'],
      ['string 0 4', '"b\\"\\"c"', 'b""c', '0 4 b""c'],
      ['string 0 2', '"\\"\\""', '""', '0 2 ""'],
      ['string 0 3', '"b\nc"', 'b\nc', '0 3 b<single-bslash>nc'],
      ['string 0 3', '"b\\nc"', 'bnc', '0 3 b<double-bslash>nc'],
      ['string 0 4', '"b\\\\ac"', 'b\\ac', 'b<quad-bslash>ac'],
      ['string 0 4', '"b\\n\\ac"', 'bnac', '0 3 bnac'],
      ['string 0 1', '"♠"', '♠', '0 1 black spade suite'],
      ['string 0 1', '"上"', '上', '0 1 上'],
      // 2 16-bit code units are considered to be 2 characters long.
      ['string 0 2', '"𠀋"', '𠀋', '0 2, char that takes 2 16-bit code units'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?string valid', () => {
    const tests = [
      ['?string 0 0', '""', '', '0 0 empty'],
      ['?string 0 1', '""', '', '0 1 empty'],
      ['?string 1 1', '"a"', 'a', '1 1 a'],
      ['?string 0 1', '"a"', 'a', '0 1 a'],
      ['?string 1 2', '"a"', 'a', '1 2 a'],
      ['?string 0 2', '"a"', 'a', '0 2 a'],
      ['?string 2 2', '"bc"', 'bc', '2 2 bc'],
      ['?string 1 2', '"bc"', 'bc', '1 2 bc'],
      ['?string 2 3', '"bc"', 'bc', '2 3 bc'],
      ['?string 1 3', '"bc"', 'bc', '1 3 bc'],
      ['?string 1 3 ^bc$', '"bc"', 'bc', '1 3 ^bc$'],
      ['?string 0 3', '"b\\"c"', 'b"c', '0 3 b"c'],
      ['?string 0 4', '"b\\"\\"c"', 'b""c', '0 4 b""c'],
      ['?string 0 2', '"\\"\\""', '""', '0 2 ""'],
      ['?string 0 3', '"b\nc"', 'b\nc', '0 3 b<single-bslash>nc'],
      ['?string 0 3', '"b\\nc"', 'bnc', '0 3 b<double-bslash>nc'],
      ['?string 0 4', '"b\\\\ac"', 'b\\ac', 'b<quad-bslash>ac'],
      ['?string 0 4', '"b\\n\\ac"', 'bnac', '0 3 bnac'],

      ['?string 0 0', 'null', null, '0 0 null'],
      ['?string 0 1', 'null', null, '0 1 null'],
      ['?string 5 5', 'null', null, '5 5 null'],
      ['?string 5 6', 'null', null, '5 6 null'],

      ['?string 0 6', '"null"', 'null', '0 6 quoted null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('string too short', () => {
    const tests = [
      ['string 1 1', '""', 'Invalid string: too short', '1 1 empty'],
      ['string 1 2', '""', 'Invalid string: too short', '1 2 empty'],
      ['string 2 2', '"a"', 'Invalid string: too short', '2 2 a'],
      ['string 2 3', '"a"', 'Invalid string: too short', '2 3 a'],
      ['string 3 3', '"bc"', 'Invalid string: too short', '3 3 bc'],
      ['string 3 4', '"bc"', 'Invalid string: too short', '3 4 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?string too short', () => {
    const tests = [
      ['?string 1 1', '""', 'Invalid ?string: too short', '1 1 empty'],
      ['?string 1 2', '""', 'Invalid ?string: too short', '1 2 empty'],
      ['?string 2 2', '"a"', 'Invalid ?string: too short', '2 2 a'],
      ['?string 2 3', '"a"', 'Invalid ?string: too short', '2 3 a'],
      ['?string 3 3', '"bc"', 'Invalid ?string: too short', '3 3 bc'],
      ['?string 3 4', '"bc"', 'Invalid ?string: too short', '3 4 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('string too long', () => {
    const tests = [
      ['string 0 0', '"a"', 'Invalid string: too long', '0 0 a'],
      ['string 0 1', '"bc"', 'Invalid string: too long', '0 1 bc'],
      ['string 1 1', '"bc"', 'Invalid string: too long', '1 1 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?string too long', () => {
    const tests = [
      ['?string 0 0', '"a"', 'Invalid ?string: too long', '0 0 a'],
      ['?string 0 1', '"bc"', 'Invalid ?string: too long', '0 1 bc'],
      ['?string 1 1', '"bc"', 'Invalid ?string: too long', '1 1 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('string invalid regex', () => {
    const tests = [
      ['string 0 10 ^ab$', '"abc"', 'Invalid string: does not match regex', '0 10 ^ab$'],
      ['string 0 10 ^a c$', '"abc"', 'Invalid string: does not match regex', '0 10 ^a c$'],

      // check that the length validation comes before the regex
      ['string 0 1 ^ab$', '"abc"', 'Invalid string: too long', '0 1 ^ab$ too long'],
      ['string 4 5 ^ab$', '"abc"', 'Invalid string: too short', '4 5 ^ab$ too short'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?string invalid regex', () => {
    const tests = [
      ['?string 0 10 ^ab$', '"abc"', 'Invalid ?string: does not match regex', '0 10 ^ab$'],
      ['?string 0 10 ^a c$', '"abc"', 'Invalid ?string: does not match regex', '0 10 ^a c$'],

      // check that the length validation comes before the regex
      ['?string 0 1 ^ab$', '"abc"', 'Invalid ?string: too long', '0 1 ^ab$ too long'],
      ['?string 4 5 ^ab$', '"abc"', 'Invalid ?string: too short', '4 5 ^ab$ too short'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('non-nullable null', () => {
    const tests = [
      ['string 0 32', 'null', 'Invalid string: null', 'null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('string malformed', () => {
    const tests = [
      ['string 0 32', '"alo', 'Incomplete payload. Some characters are missing at the end', '"alo'],
      ['string 0 32', 'ola"', 'Invalid string opening char. Expected: ", found: o', 'ola"'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?string malformed', () => {
    const tests = [
      ['?string 0 32', '"alo', 'Incomplete payload. Some characters are missing at the end', '"alo'],
      ['?string 0 32', 'ola"', 'Invalid string opening char. Expected: ", found: o', 'ola"'],

      ['?string 0 0', 'bull', 'Invalid string opening char. Expected: ", found: b', 'bull'],
      ['?string 0 0', 'nulb', 'Invalid null literal. Expected: null, found: nulb', 'nulb'],
      ['?string 0 0', 'nul', 'Incomplete payload. Some characters are missing at the end', 'nulb'],
      ['?string 0 0', 'nulll', 'Parser has already finished. There are redundant characters after the enclosing char', 'nulb'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
