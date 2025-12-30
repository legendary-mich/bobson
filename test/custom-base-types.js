'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')

describe('base types', () => {

  describe('override_mixin', () => {
    it('key is not a string', () => {
      try {
        const builder = new Bobson_Builder()
        builder.override_mixin(null)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: string, found: null')
      }
    })

    it('mixin is not an object', () => {
      try {
        const builder = new Bobson_Builder()
        builder.override_mixin('string', null)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: object, found: null')
      }
    })

    it('mixin is missing a parser_fn', () => {
      try {
        const builder = new Bobson_Builder()
        builder.override_mixin('string', {
          serializer_fn: s => s,
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid parser_fn. Expected: function, found: undefined')
      }
    })

    it('mixin is missing a serializer_fn', () => {
      try {
        const builder = new Bobson_Builder()
        builder.override_mixin('string', {
          parser_fn: s => s,
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid serializer_fn. Expected: function, found: undefined')
      }
    })

    it('key is prefixed', () => {
      try {
        const builder = new Bobson_Builder()
        builder.override_mixin('?string', {
          parser_fn: s => s,
          serializer_fn: s => s,
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid prefix. Expected: (not ?), found: (?)')
      }
    })

    it('key is not known', () => {
      try {
        const builder = new Bobson_Builder()
        builder.override_mixin('made-up', {})
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Unknown schema type: made-up')
      }
    })

  })

  describe('add_base_type', () => {
    it('key is not a string', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_base_type(null)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: string, found: null')
      }
    })

    it('mixin are not an object', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_base_type('string', 2)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: object, found: Number')
      }
    })

    it('mixin is missing a parser_fn', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_base_type('string', {
          serializer_fn: s => s,
        }, () => {})
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid parser_fn. Expected: function, found: undefined')
      }
    })

    it('mixin is missing a serializer_fn', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_base_type('string', {
          parser_fn: s => s,
        }, () => {})
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid serializer_fn. Expected: function, found: undefined')
      }
    })

    it('raw_factory_fn is not a function', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_base_type('string', {
          parser_fn: s => s,
          serializer_fn: s => s,
        }, 'lolo')
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: function, found: String')
      }
    })

    it('factory_fn is not a function', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_base_type('string', {
          parser_fn: s => s,
          serializer_fn: s => s,
        }, () => {}, 'lolo')
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: function, found: String')
      }
    })

    it('key is prefixed', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_base_type('?string', {
          parser_fn: s => s,
          serializer_fn: s => s,
        }, () => {})
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid prefix. Expected: (not ?), found: (?)')
      }
    })

  })
})
