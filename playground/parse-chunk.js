'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const parser = bobson.get_parser("string 0 10")
parser.parse_chunk('"john w')
parser.parse_chunk('ayne"')
const parsed_messaeg = parser.get_result()
console.log('// output:', parsed_messaeg)
// output: john wayne
