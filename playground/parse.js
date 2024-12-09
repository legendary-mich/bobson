'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const user_schema = {
  '+ name'   : 'string 3 12',
  '- age'    : 'int_4 0 120',
  '- height' : '?int_4 30 220',
}
const parser = bobson.get_parser(user_schema)
const parsed_user = parser.parse('{"name":"bob","age":"25","height":"180"}')

console.log('// output:', parsed_user)
// output: { name: 'bob', age: 25, height: 180 }
