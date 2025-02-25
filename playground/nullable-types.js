'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()

const string      = '?string 0 2'
const regex       = '?string 0 2 ^ab$'
const enumeration = '?enum red green blue'
const bool        = '?bool'
const int_4       = '?int_4 -10 10'
const int_js      = '?int_js -10 10'
const int_8       = '?int_8 -10 10'
const decimal     = '?decimal -2.23 9.99'
const array       = ['?array 0 5', 'string 0 2']
const object      = ["?object", { // nullable
  '+ name'    : '?string 3 12',   // nullable
  '+ password': 'string 6 12',
  '- age'     : '?int_4 0 120',   // nullable
  '- height'  : 'int_4 0 120',
}]

const all = [
  string,
  regex,
  enumeration,
  bool,
  int_4,
  int_js,
  int_8,
  decimal,
  array,
  object,
]

for (const schema of all) {
  const p = bobson.get_parser(schema)
}
