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

describe('array edge cases', () => {
  describe('array valid', () => {
    const tests = [
      [['string 1 1', '0 0'], '[]', [], '0 0 empty'],
      [['string 1 1', '0 1'], '[]', [], '0 1 empty'],
      [['string 1 1', '1 1'], '["a"]', ['a'], '1 1 a'],
      [['string 1 1', '0 1'], '["a"]', ['a'], '0 1 a'],
      [['string 1 1', '1 2'], '["a"]', ['a'], '1 2 a'],
      [['string 1 1', '0 2'], '["a"]', ['a'], '0 2 a'],
      [['string 1 1', '2 2'], '["b","c"]', ['b','c'], '2 2 bc'],
      [['string 1 1', '1 2'], '["b","c"]', ['b','c'], '1 2 bc'],
      [['string 1 1', '2 3'], '["b","c"]', ['b','c'], '2 3 bc'],
      [['string 1 1', '1 3'], '["b","c"]', ['b','c'], '1 3 bc'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?array valid', () => {
    const tests = [
      [['?', 'string 1 1', '0 0'], '[]', [], '0 0 empty'],
      [['?', 'string 1 1', '0 1'], '[]', [], '0 1 empty'],
      [['?', 'string 1 1', '1 1'], '["a"]', ['a'], '1 1 a'],
      [['?', 'string 1 1', '0 1'], '["a"]', ['a'], '0 1 a'],
      [['?', 'string 1 1', '1 2'], '["a"]', ['a'], '1 2 a'],
      [['?', 'string 1 1', '0 2'], '["a"]', ['a'], '0 2 a'],
      [['?', 'string 1 1', '2 2'], '["b","c"]', ['b','c'], '2 2 bc'],
      [['?', 'string 1 1', '1 2'], '["b","c"]', ['b','c'], '1 2 bc'],
      [['?', 'string 1 1', '2 3'], '["b","c"]', ['b','c'], '2 3 bc'],
      [['?', 'string 1 1', '1 3'], '["b","c"]', ['b','c'], '1 3 bc'],

      [['?', 'string 1 1', '0 0'], 'null', null, '0 0 null'],
      [['?', 'string 1 1', '0 1'], 'null', null, '0 1 null'],
      [['?', 'string 1 1', '5 5'], 'null', null, '5 5 null'],
      [['?', 'string 1 1', '5 6'], 'null', null, '5 6 null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('array too short', () => {
    const tests = [
      [['string 1 1', '1 1'], '[]', 'Invalid array: too short', '1 1 empty'],
      [['string 1 1', '1 2'], '[]', 'Invalid array: too short', '1 2 empty'],
      [['string 1 1', '2 2'], '["a"]', 'Invalid array: too short', '2 2 a'],
      [['string 1 1', '2 3'], '["a"]', 'Invalid array: too short', '2 3 a'],
      [['string 1 1', '3 3'], '["b","c"]', 'Invalid array: too short', '3 3 bc'],
      [['string 1 1', '3 4'], '["b","c"]', 'Invalid array: too short', '3 4 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?array too short', () => {
    const tests = [
      [['?', 'string 1 1', '1 1'], '[]', 'Invalid ?array: too short', '1 1 empty'],
      [['?', 'string 1 1', '1 2'], '[]', 'Invalid ?array: too short', '1 2 empty'],
      [['?', 'string 1 1', '2 2'], '["a"]', 'Invalid ?array: too short', '2 2 a'],
      [['?', 'string 1 1', '2 3'], '["a"]', 'Invalid ?array: too short', '2 3 a'],
      [['?', 'string 1 1', '3 3'], '["b","c"]', 'Invalid ?array: too short', '3 3 bc'],
      [['?', 'string 1 1', '3 4'], '["b","c"]', 'Invalid ?array: too short', '3 4 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('array too long', () => {
    const tests = [
      [['string 1 1', '0 0'], '["a"]', 'Invalid array: too long', '0 0 a'],
      [['string 1 1', '0 1'], '["b","c"]', 'Invalid array: too long', '0 1 bc'],
      [['string 1 1', '1 1'], '["b","c"]', 'Invalid array: too long', '1 1 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?array too long', () => {
    const tests = [
      [['?', 'string 1 1', '0 0'], '["a"]', 'Invalid ?array: too long', '0 0 a'],
      [['?', 'string 1 1', '0 1'], '["b","c"]', 'Invalid ?array: too long', '0 1 bc'],
      [['?', 'string 1 1', '1 1'], '["b","c"]', 'Invalid ?array: too long', '1 1 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('non-nullable null', () => {
    const tests = [
      [['string 1 1', '0 0'], 'null', 'Invalid array: null', 'null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid string inside an array', () => {
    const tests = [
      [['string 1 1', '0 1'], '["ab"]', 'Invalid string: too long', 'ab'],
      [['?', 'string 1 1', '0 1'], '["ab"]', 'Invalid string: too long', '? ab'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('array malformed', () => {
    const tests = [
      [['string 1 1', '0 10'], '[', 'Incomplete payload. Some characters are missing at the end', '['],
      [['string 1 1', '0 10'], ']', 'Invalid array opening char. Expected: [, found: ]', ']'],
      [['string 1 1', '0 10'], '["a",]', 'Invalid string opening char. Expected: ", found: ]', '["a",]'],
      [['string 1 1', '0 10'], '["a"b]', 'Invalid array enclosing char. Expected: , or ], found: b', '["a"b]'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?array malformed', () => {
    const tests = [
      [['?', 'string 1 1', '0 10'], '[', 'Incomplete payload. Some characters are missing at the end', '['],
      [['?', 'string 1 1', '0 10'], ']', 'Invalid array opening char. Expected: [, found: ]', ']'],
      [['?', 'string 1 1', '0 10'], '["a",]', 'Invalid string opening char. Expected: ", found: ]', '["a",]'],

      [['?', 'string 1 1', '0 10'], 'bull', 'Invalid array opening char. Expected: [, found: b', 'bull'],
      [['?', 'string 1 1', '0 10'], 'nulb', 'Invalid null literal. Expected: null, found: nulb', 'nulb'],
      [['?', 'string 1 1', '0 10'], 'nul', 'Incomplete payload. Some characters are missing at the end', 'nul'],
      [['?', 'string 1 1', '0 10'], 'nulll', 'Parser has already finished. There are redundant characters after the enclosing char', 'nulll'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('valid with all types', () => {
    const tests = [
      [['string 1 1', '0 1'], '[]', [], 'string empty'],
      [['string 1 1', '0 1'], '["a"]', ['a'], 'string full'],
      [['?string 1 1', '0 1'], '[]', [], '?string empty'],
      [['?string 1 1', '0 1'], '["a"]', ['a'], '?string full'],
      [['?string 1 1', '0 1'], '[null]', [null], '?string null'],

      [['enum bo', '0 1'], '[]', [], 'enum empty'],
      [['enum bo', '0 1'], '["bo"]', ['bo'], 'enum full'],
      [['?enum bo', '0 1'], '[]', [], '?enum empty'],
      [['?enum bo', '0 1'], '["bo"]', ['bo'], '?enum full'],
      [['?enum bo', '0 1'], '[null]', [null], '?enum null'],

      [[{}, '0 1'], '[]', [], 'object empty'],
      [[{}, '0 1'], '[{}]', [{}], 'object full'],
      [[{"?":true}, '0 1'], '[]', [], '?object empty'],
      [[{"?":true}, '0 1'], '[{}]', [{}], '?object full'],
      [[{"?":true}, '0 1'], '[null]', [null], '?object null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

})
