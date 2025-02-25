'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const user_schema = ["object", {
  '+ name'  : 'string 3 12',   // + means required
  '- age'   : 'int_4 0 120',   // - means optional
  '- height': '?int_4 30 220', // ? means nullable
  '+ gender': '?bool',         // gender is required and nullable
}]
const bobson_message = '{"name":"bob","age":"25","gender":null}'
const parsed_user = bobson.parse(user_schema, bobson_message)
console.log('// output:', parsed_user)
// output: { name: 'bob', age: 25, gender: null }
