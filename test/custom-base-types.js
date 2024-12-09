'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')

describe('base types', () => {

  describe('various cases', () => {
    it('not an object', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_base_types(null)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: object, found: null')
      }
    })

    it('not a function', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_base_types({
          'key': [],
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: function, found: array')
      }
    })
  })
})
