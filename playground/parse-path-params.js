'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const query_schema = {
  '+ id': 'int_js 1 max',
}
const path_params = {id: '200'}
const parsed_query = bobson.parse_path_params(query_schema, path_params)

console.log('// output:', parsed_query)
// output: { id: 200 }
