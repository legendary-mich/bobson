'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const schema = ["object", {
  '+ id': 'int_js 1 max',
  '+ values': ['array 0 3', 'int_4 0 20'],
}]
const parsed_pairs = bobson.parse_flat_pairs(schema, [['id', '200'],['values', '2,3,4']])

console.log('// output:', parsed_pairs)
// output: { id: 200, values: [ 2, 3, 4 ] }
