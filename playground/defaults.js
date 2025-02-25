'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_derived_types({
  "user": ["object", {
    "+ id": "int_4 0 max",
    "- name": "string 1 10",
    "- height": "int_4 0 230",
  }, {
    "name": "john", // default value
  }],
})
const bobson_string = '{"id":"2"}'
const parsed_user = bobson.parse('user', bobson_string)
console.log('// output:', parsed_user)
// output: { id: 2, name: 'john' }
