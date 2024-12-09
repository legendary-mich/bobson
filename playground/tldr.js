'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const user_schema = {
  '+ name'   : 'string 3 12', // required
  '- age'    : 'int_4 0 120', // optional
  '- height' : '?int_4 30 220', // nullable
}
const bobson_string = '{"name":"bob","age":"25","height":"180"}'
const parser = bobson.get_parser(user_schema)
const parsed_user = parser.parse(bobson_string)

console.log('// output:', parsed_user)
// output: { name: 'bob', age: 25, height: 180 }
