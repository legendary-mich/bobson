'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()

const string         = 'string 0 2'
const regex          = 'string 0 2 ^ab$'
const enumeration    = 'enum red green blue'
const int_4          = 'int_4 -10 10'
const int_4_min_max  = 'int_4 min max' // [-2147483648, 2147483647]
const int_js         = 'int_js -10 10'
const int_js_min_max = 'int_js min max' // [-9007199254740991, 9007199254740991]
const int_8          = 'int_8 -10 10'
const int_8_min_max  = 'int_8 min max' // [-9223372036854775808, 9223372036854775807]
const decimal        = 'decimal -2.23 9.99'
const array          = ['array 0 5', 'string 0 2']
const object         = {
  '+ name'    : 'string 3 12', // required
  '+ password': 'string 6 12', // required
  '- age'     : 'int_4 0 120', // optional
}

const all = [
  string,
  regex,
  enumeration,
  int_4,
  int_4_min_max,
  int_js,
  int_js_min_max,
  int_8,
  int_8_min_max,
  decimal,
  array,
  object,
]

for (const schema of all) {
  const p = bobson.get_parser(schema)
}
