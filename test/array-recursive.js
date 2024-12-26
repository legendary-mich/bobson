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

describe('array recursive', () => {
  before(() => {
    bobson = new Bobson_Builder()
  })

  describe('array valid', () => {
    const tests = [
      [['array 0 1', ['array 0 0', 'string 1 1']], '[[]]', [[]], '0 0 empty'],
      [['array 0 1', ['array 0 1', 'string 1 1']], '[[]]', [[]], '0 1 empty'],
      [['array 0 1', ['array 1 1', 'string 1 1']], '[["a"]]', [['a']], '1 1 a'],
      [['array 0 1', ['array 0 1', 'string 1 1']], '[["a"]]', [['a']], '0 1 a'],
      [['array 0 1', ['array 1 2', 'string 1 1']], '[["a"]]', [['a']], '1 2 a'],
      [['array 0 1', ['array 0 2', 'string 1 1']], '[["a"]]', [['a']], '0 2 a'],
      [['array 0 1', ['array 2 2', 'string 1 1']], '[["b","c"]]', [['b','c']], '2 2 bc'],
      [['array 0 1', ['array 1 2', 'string 1 1']], '[["b","c"]]', [['b','c']], '1 2 bc'],
      [['array 0 1', ['array 2 3', 'string 1 1']], '[["b","c"]]', [['b','c']], '2 3 bc'],
      [['array 0 1', ['array 1 3', 'string 1 1']], '[["b","c"]]', [['b','c']], '1 3 bc'],

      [['array 0 2', ['array 1 1', 'string 1 1']], '[["d"],["e"]]', [['d'],['e']], '0 2 de'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?array valid', () => {
    const tests = [
      [['array 0 1', ['?array 0 0', 'string 1 1']], '[[]]', [[]], '0 0 empty'],
      [['array 0 1', ['?array 0 1', 'string 1 1']], '[[]]', [[]], '0 1 empty'],
      [['array 0 1', ['?array 1 1', 'string 1 1']], '[["a"]]', [['a']], '1 1 a'],
      [['array 0 1', ['?array 0 1', 'string 1 1']], '[["a"]]', [['a']], '0 1 a'],
      [['array 0 1', ['?array 1 2', 'string 1 1']], '[["a"]]', [['a']], '1 2 a'],
      [['array 0 1', ['?array 0 2', 'string 1 1']], '[["a"]]', [['a']], '0 2 a'],
      [['array 0 1', ['?array 2 2', 'string 1 1']], '[["b","c"]]', [['b','c']], '2 2 bc'],
      [['array 0 1', ['?array 1 2', 'string 1 1']], '[["b","c"]]', [['b','c']], '1 2 bc'],
      [['array 0 1', ['?array 2 3', 'string 1 1']], '[["b","c"]]', [['b','c']], '2 3 bc'],
      [['array 0 1', ['?array 1 3', 'string 1 1']], '[["b","c"]]', [['b','c']], '1 3 bc'],

      [['array 0 2', ['?array 1 1', 'string 1 1']], '[["d"],["e"]]', [['d'],['e']], '0 2 de'],

      [['array 0 1', ['?array 0 0', 'string 1 1']], '[null]', [null], '0 0 null'],
      [['array 0 2', ['?array 1 1', 'string 1 1']], '[null,null]', [null,null], '0 2 null null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('array too short', () => {
    const tests = [
      [['array 0 1', ['array 1 1', 'string 1 1']], '[[]]', 'Invalid array: too short', '1 1 empty'],
      [['array 0 1', ['array 1 2', 'string 1 1']], '[[]]', 'Invalid array: too short', '1 2 empty'],
      [['array 0 1', ['array 2 2', 'string 1 1']], '[["a"]]', 'Invalid array: too short', '2 2 a'],
      [['array 0 1', ['array 2 3', 'string 1 1']], '[["a"]]', 'Invalid array: too short', '2 3 a'],
      [['array 0 1', ['array 3 3', 'string 1 1']], '[["b","c"]]', 'Invalid array: too short', '3 3 bc'],
      [['array 0 1', ['array 3 4', 'string 1 1']], '[["b","c"]]', 'Invalid array: too short', '3 4 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?array too short', () => {
    const tests = [
      [['array 0 1', ['?array 1 1', 'string 1 1']], '[[]]', 'Invalid ?array: too short', '1 1 empty'],
      [['array 0 1', ['?array 1 2', 'string 1 1']], '[[]]', 'Invalid ?array: too short', '1 2 empty'],
      [['array 0 1', ['?array 2 2', 'string 1 1']], '[["a"]]', 'Invalid ?array: too short', '2 2 a'],
      [['array 0 1', ['?array 2 3', 'string 1 1']], '[["a"]]', 'Invalid ?array: too short', '2 3 a'],
      [['array 0 1', ['?array 3 3', 'string 1 1']], '[["b","c"]]', 'Invalid ?array: too short', '3 3 bc'],
      [['array 0 1', ['?array 3 4', 'string 1 1']], '[["b","c"]]', 'Invalid ?array: too short', '3 4 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('array too long', () => {
    const tests = [
      [['array 0 10', ['array 0 0', 'string 1 1']], '[["a"]]', 'Invalid array: too long', '0 0 a'],
      [['array 0 10', ['array 0 1', 'string 1 1']], '[["b","c"]]', 'Invalid array: too long', '0 1 bc'],
      [['array 0 10', ['array 1 1', 'string 1 1']], '[["b","c"]]', 'Invalid array: too long', '1 1 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?array too long', () => {
    const tests = [
      [['array 0 10', ['?array 0 0', 'string 1 1']], '[["a"]]', 'Invalid ?array: too long', '0 0 a'],
      [['array 0 10', ['?array 0 1', 'string 1 1']], '[["b","c"]]', 'Invalid ?array: too long', '0 1 bc'],
      [['array 0 10', ['?array 1 1', 'string 1 1']], '[["b","c"]]', 'Invalid ?array: too long', '1 1 bc'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('non-nullable null', () => {
    const tests = [
      [['array 0 1', ['array 0 0', 'string 1 1']], '[null]', 'Invalid array: null', 'null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('invalid string inside an array', () => {
    const tests = [
      [['array 0 1', ['array 0 1', 'string 1 1']], '[["ab"]]', 'Invalid string: too long', 'ab'],
      [['array 0 1', ['?array 0 1', 'string 1 1']], '[["ab"]]', 'Invalid string: too long', '? ab'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
