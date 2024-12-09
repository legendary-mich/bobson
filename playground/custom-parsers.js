'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
// IMPORTANT! Parser functions should be added before derived types.
bobson.add_parser_functions({
  'color': (string) => {
    switch (string) {
    case 'red': return '#ff0000'
    case 'green': return '#00ff00'
    case 'blue': return '#0000ff'
    }},
})
bobson.add_derived_types({
  'color': 'enum red green blue',
})
const bobson_string = '"green"'
const parser = bobson.get_parser('color')
const parsed_color = parser.parse(bobson_string)

console.log('// output:', parsed_color)
// output: #00ff00
