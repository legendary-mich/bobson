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

describe('array edge cases', () => {
  before(() => {
    bobson = new Bobson_Builder()
  })

  describe('array valid', () => {
    const tests = [
      [['array 0 0', 'string 1 1'], '[]', [], '0 0 empty'],
      [['array 0 1', 'string 1 1'], '[]', [], '0 1 empty'],
      [['array 1 1', 'string 1 1'], '["a"]', ['a'], '1 1 a'],
      [['array 0 1', 'string 1 1'], '["a"]', ['a'], '0 1 a'],
      [['array 1 2', 'string 1 1'], '["a"]', ['a'], '1 2 a'],
      [['array 0 2', 'string 1 1'], '["a"]', ['a'], '0 2 a'],
      [['array 2 2', 'string 1 1'], '["b","c"]', ['b','c'], '2 2 bc'],
      [['array 1 2', 'string 1 1'], '["b","c"]', ['b','c'], '1 2 bc'],
      [['array 2 3', 'string 1 1'], '["b","c"]', ['b','c'], '2 3 bc'],
      [['array 1 3', 'string 1 1'], '["b","c"]', ['b','c'], '1 3 bc'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?array valid', () => {
    const tests = [
      [['?array 0 0', 'string 1 1'], '[]', [], '0 0 empty'],
      [['?array 0 1', 'string 1 1'], '[]', [], '0 1 empty'],
      [['?array 1 1', 'string 1 1'], '["a"]', ['a'], '1 1 a'],
      [['?array 0 1', 'string 1 1'], '["a"]', ['a'], '0 1 a'],
      [['?array 1 2', 'string 1 1'], '["a"]', ['a'], '1 2 a'],
      [['?array 0 2', 'string 1 1'], '["a"]', ['a'], '0 2 a'],
      [['?array 2 2', 'string 1 1'], '["b","c"]', ['b','c'], '2 2 bc'],
      [['?array 1 2', 'string 1 1'], '["b","c"]', ['b','c'], '1 2 bc'],
      [['?array 2 3', 'string 1 1'], '["b","c"]', ['b','c'], '2 3 bc'],
      [['?array 1 3', 'string 1 1'], '["b","c"]', ['b','c'], '1 3 bc'],

      [['?array 0 0', 'string 1 1'], 'null', null, '0 0 null'],
      [['?array 0 1', 'string 1 1'], 'null', null, '0 1 null'],
      [['?array 5 5', 'string 1 1'], 'null', null, '5 5 null'],
      [['?array 5 6', 'string 1 1'], 'null', null, '5 6 null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('array too short', () => {
    const tests = [
      [['array 1 1', 'string 1 1'], '[]', 'Invalid array: too short', '1 1 empty'],
      [['array 1 2', 'string 1 1'], '[]', 'Invalid array: too short', '1 2 empty'],
      [['array 2 2', 'string 1 1'], '["a"]', 'Invalid array: too short', '2 2 a'],
      [['array 2 3', 'string 1 1'], '["a"]', 'Invalid array: too short', '2 3 a'],
      [['array 3 3', 'string 1 1'], '["b","c"]', 'Invalid array: too short', '3 3 bc'],
      [['array 3 4', 'string 1 1'], '["b","c"]', 'Invalid array: too short', '3 4 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?array too short', () => {
    const tests = [
      [['?array 1 1', 'string 1 1'], '[]', 'Invalid ?array: too short', '1 1 empty'],
      [['?array 1 2', 'string 1 1'], '[]', 'Invalid ?array: too short', '1 2 empty'],
      [['?array 2 2', 'string 1 1'], '["a"]', 'Invalid ?array: too short', '2 2 a'],
      [['?array 2 3', 'string 1 1'], '["a"]', 'Invalid ?array: too short', '2 3 a'],
      [['?array 3 3', 'string 1 1'], '["b","c"]', 'Invalid ?array: too short', '3 3 bc'],
      [['?array 3 4', 'string 1 1'], '["b","c"]', 'Invalid ?array: too short', '3 4 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('array too long', () => {
    const tests = [
      [['array 0 0', 'string 1 1'], '["a"]', 'Invalid array: too long', '0 0 a'],
      [['array 0 1', 'string 1 1'], '["b","c"]', 'Invalid array: too long', '0 1 bc'],
      [['array 1 1', 'string 1 1'], '["b","c"]', 'Invalid array: too long', '1 1 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?array too long', () => {
    const tests = [
      [['?array 0 0', 'string 1 1'], '["a"]', 'Invalid ?array: too long', '0 0 a'],
      [['?array 0 1', 'string 1 1'], '["b","c"]', 'Invalid ?array: too long', '0 1 bc'],
      [['?array 1 1', 'string 1 1'], '["b","c"]', 'Invalid ?array: too long', '1 1 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('non-nullable null', () => {
    const tests = [
      [['array 0 0', 'string 1 1'], 'null', 'Invalid array: null', 'null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid string inside an array', () => {
    const tests = [
      [['array 0 1', 'string 1 1'], '["ab"]', 'Invalid string: too long', 'ab'],
      [['?array 0 1', 'string 1 1'], '["ab"]', 'Invalid string: too long', '? ab'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('array malformed', () => {
    const tests = [
      [['array 0 10', 'string 1 1'], '[', 'Incomplete payload. Some characters are missing at the end', '['],
      [['array 0 10', 'string 1 1'], ']', 'Invalid array opening char. Expected: [, found: ]', ']'],
      [['array 0 10', 'string 1 1'], '["a",]', 'Invalid string opening char. Expected: ", found: ]', '["a",]'],
      [['array 0 10', 'string 1 1'], '["a"b]', 'Invalid array enclosing char. Expected: , or ], found: b', '["a"b]'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?array malformed', () => {
    const tests = [
      [['?array 0 10', 'string 1 1'], '[', 'Incomplete payload. Some characters are missing at the end', '['],
      [['?array 0 10', 'string 1 1'], ']', 'Invalid array opening char. Expected: [, found: ]', ']'],
      [['?array 0 10', 'string 1 1'], '["a",]', 'Invalid string opening char. Expected: ", found: ]', '["a",]'],

      [['?array 0 10', 'string 1 1'], 'bull', 'Invalid array opening char. Expected: [, found: b', 'bull'],
      [['?array 0 10', 'string 1 1'], 'nulb', 'Invalid null literal. Expected: null, found: nulb', 'nulb'],
      [['?array 0 10', 'string 1 1'], 'nul', 'Incomplete payload. Some characters are missing at the end', 'nul'],
      [['?array 0 10', 'string 1 1'], 'nulll', 'Parser has already finished. There are redundant characters after the enclosing char', 'nulll'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('valid with all types', () => {
    const tests = [
      [['array 0 1', 'string 1 1'], '[]', [], 'string empty'],
      [['array 0 1', 'string 1 1'], '["a"]', ['a'], 'string full'],
      [['array 0 1', '?string 1 1'], '[]', [], '?string empty'],
      [['array 0 1', '?string 1 1'], '["a"]', ['a'], '?string full'],
      [['array 0 1', '?string 1 1'], '[null]', [null], '?string null'],

      [['array 0 1', 'enum bo'], '[]', [], 'enum empty'],
      [['array 0 1', 'enum bo'], '["bo"]', ['bo'], 'enum full'],
      [['array 0 1', '?enum bo'], '[]', [], '?enum empty'],
      [['array 0 1', '?enum bo'], '["bo"]', ['bo'], '?enum full'],
      [['array 0 1', '?enum bo'], '[null]', [null], '?enum null'],

      [['array 0 1', ["object", {}]], '[]', [], 'object empty'],
      [['array 0 1', ["object", {}]], '[{}]', [{}], 'object full'],
      [['array 0 1', ["?object", {}]], '[]', [], '?object empty'],
      [['array 0 1', ["?object", {}]], '[{}]', [{}], '?object full'],
      [['array 0 1', ["?object", {}]], '[null]', [null], '?object null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

})
