'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.override_mixin('decimal', {
  parser_fn: parseFloat,
  serializer_fn: (r) => r * 2,
  comparer_fn: (a, b) => a > b ? 1 : a === b ? 0 : -1,
})
const bobson_string = '"12.3"'
const parser = bobson.get_parser('decimal 0.0 100.0')
const serializer = bobson.get_serializer('decimal 0.0 100.0')
const parsed_val = parser.parse(bobson_string)
const serialized_val = serializer.serialize(parsed_val)

console.log('// output:', parsed_val)
console.log('// output:', serialized_val)
// output: 12.3
// output: 24.6
