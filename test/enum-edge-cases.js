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

describe('enum edge cases', () => {
  before(() => {
    bobson = new Bobson_Builder()
  })

  describe('enum valid', () => {
    const tests = [
      ['enum a', '"a"', 'a', 'a'],
      ['enum bo', '"bo"', 'bo', 'bo'],
      ['enum alo orra ro', '"alo"', 'alo', 'alo'],
      ['enum alo orra ro', '"orra"', 'orra', 'orra'],
      ['enum alo orra ro', '"ro"', 'ro', 'ro'],

      [['enum', 'alo', 'or ra', 'ro'], '"or ra"', 'or ra', 'with space'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?enum valid', () => {
    const tests = [
      ['?enum a', '"a"', 'a', 'a'],
      ['?enum bo', '"bo"', 'bo', 'bo'],
      ['?enum alo orra ro', '"alo"', 'alo', 'alo'],
      ['?enum alo orra ro', '"orra"', 'orra', 'orra'],
      ['?enum alo orra ro', '"ro"', 'ro', 'ro'],

      ['?enum alo orra ro', 'null', null, 'null'],

      [['?enum', 'alo', 'or ra', 'ro'], '"or ra"', 'or ra', 'with space'],
      [['?enum', 'alo', 'or ra', 'ro'], 'null', null, 'null with space'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('enum too short', () => {
    const tests = [
      ['enum a', '""', 'Invalid enum: too short', 'empty'],
      ['enum bo', '"b"', 'Invalid enum: too short', 'b'],
      ['enum abcd log', '"ro"', 'Invalid enum: too short', 'ro'],

      [['enum', 'abcd', 'log'], '"ro"', 'Invalid enum: too short', 'too short in arr'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?enum too short', () => {
    const tests = [
      ['?enum a', '""', 'Invalid ?enum: too short', 'empty'],
      ['?enum bo', '"b"', 'Invalid ?enum: too short', 'b'],
      ['?enum abcd log', '"ro"', 'Invalid ?enum: too short', 'ro'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('enum too long', () => {
    const tests = [
      ['enum a', '"ab"', 'Invalid enum: too long', 'ab'],
      ['enum bo', '"boc"', 'Invalid enum: too long', 'boc'],
      ['enum a lo c', '"rok"', 'Invalid enum: too long', 'rok'],

      [['enum', 'a', 'lo s', 'c'], '"lo ss"', 'Invalid enum: too long', 'lo ss with spae'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?enum too long', () => {
    const tests = [
      ['?enum a', '"ab"', 'Invalid ?enum: too long', 'ab'],
      ['?enum bo', '"boc"', 'Invalid ?enum: too long', 'boc'],
      ['?enum a lo c', '"rok"', 'Invalid ?enum: too long', 'rok'],

      [['?enum', 'a', 'lo s', 'c'], '"lo ss"', 'Invalid ?enum: too long', 'lo ss with spae'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('unknown enum', () => {
    const tests = [
      ['enum alo orra ro', '""', 'Invalid enum: too short', 'empty'],
      ['enum alo orra ro', '"rok"', 'Invalid enum: rok', 'rok'],
      ['?enum alo orra ro', '"rok"', 'Invalid ?enum: rok', '?rok'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('non-nullable null', () => {
    const tests = [
      ['enum a', 'null', 'Invalid enum: null', 'ab'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
