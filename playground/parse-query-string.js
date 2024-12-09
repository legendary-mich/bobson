'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const query_schema = {
  '+ id': 'int_js 1 max',
}
const parsed_query = bobson.parse_query_string(query_schema, '/user?id=200')

console.log('// output:', parsed_query)
// output: { id: 200 }
