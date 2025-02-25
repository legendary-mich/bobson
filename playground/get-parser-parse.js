'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const parser = bobson.get_parser("string 0 10")
const parsed_message = parser.parse('"lolo"')
console.log('// output:', parsed_message)
// output: lolo
