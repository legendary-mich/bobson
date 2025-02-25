'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()

const string   = 'string 0 2' // min-length: 0, max-length: 2
const regex    = 'string 0 2 ^ab$'
const enum_a   = 'enum red green blue'
const enum_b   = ['enum', 'red', 'green', 'blue'] // same as above
const bool     = 'bool'
const int_4_a  = 'int_4 -10 max' // min: -10, max: 2147483647
const int_4_b  = 'int_4 min 10' // min: -2147483648, max: 10
const int_js_a = 'int_js -10 max' // min: -10, max: 9007199254740991
const int_js_b = 'int_js min 10' // min: -9007199254740991, max: 10
const int_8_a  = 'int_8 -10 max' // min: -10n, max: 9223372036854775807n
const int_8_b  = 'int_8 min 10' // min: -9223372036854775808n, max: 10n
const decimal  = 'decimal -2.23 9.99' // max-number-of-decimal-digits: 2
const array    = ['array 0 5', 'string 0 2'] // min-length: 0, max-length: 5
const object   = ["object", {
  '+ name'    : 'string 3 12', // name is required (+)
  '+ password': 'string 6 12', // password is required (+)
  '- age'     : 'int_4 0 120', // age is optional (-)
}]

const all = [
  string,
  regex,
  enum_a,
  enum_b,
  bool,
  int_4_a,
  int_4_b,
  int_js_a,
  int_js_b,
  int_8_a,
  int_8_b,
  decimal,
  array,
  object,
]

for (const schema of all) {
  const p = bobson.get_parser(schema)
}
