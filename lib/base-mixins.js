'use strict'

const Big = require('big.js')

module.exports = {
  object: {
    parser_fn: (r) => r,
    serializer_fn: (object, object_schema) => {
      let res = ''
      let num_of_entries = 0
      for (const [key, val] of Object.entries(object)) {
        const child_schema = object_schema.fields.get(key)
        if (child_schema) {
          const leading_coma = num_of_entries > 0 ? ',':''
          res += `${leading_coma}"${key}":${child_schema.serialize(val)}`
          ++num_of_entries
        }
      }
      return res
    },
  },
  array: {
    parser_fn: (r) => r,
    serializer_fn: (array, array_schema) => {
      let res = ''
      let num_of_entries = 0
      const schema = array_schema.child_schema
      for (const val of array) {
        const leading_coma = num_of_entries > 0 ? ',':''
        res += `${leading_coma}${schema.serialize(val)}`
        ++num_of_entries
      }
      return res
    },
  },
  string: {
    parser_fn: (r) => r,
    serializer_fn: (r) => r.replace(/([\\"])/g, '\\$1'),
  },
  number: {
    parser_fn: parseFloat,
    serializer_fn: (r) => r + '',
    comparer_fn: (a, b) => a > b ? 1 : a === b ? 0 : -1,
  },
  bigint: {
    parser_fn: BigInt,
    serializer_fn: (r) => r + '',
    comparer_fn: (a, b) => a > b ? 1 : a === b ? 0 : -1,
  },
  'big.js': {
    parser_fn: (r) => new Big(r),
    // If you want TRAILING ZEROS to be truncated use r.round followed by
    // toString, but be WARNED that the toString method serializes numbers
    // greater than 9.99e+20 in exponential notation.
    // y = new Big('1E21'); y.toString(); // '1e+21'
    // serializer_fn: (r, decimal_schema) => '"' + r.round(decimal_schema.scale).toString() + '"',
    serializer_fn: (r, decimal_schema) => r.toFixed(decimal_schema.scale),
    comparer_fn: (a, b) => a.gt(b) ? 1 : a.eq(b) ? 0 : -1,
  },
}
