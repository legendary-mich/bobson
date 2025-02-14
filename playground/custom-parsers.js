'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_derived_type('color', 'enum red green blue', {
  parser_fn: (string) => {
    switch (string) {
    case 'red': return '#ff0000'
    case 'green': return '#00ff00'
    case 'blue': return '#0000ff'
    }
  },
  serializer_fn: (string) => {
    switch (string) {
    case '#ff0000': return 'red'
    case '#00ff00': return 'green'
    case '#0000ff': return 'blue'
    }
  },
})
const bobson_string = '"green"'
const parser = bobson.get_parser('color')
const serializer = bobson.get_serializer('color')
const parsed_color = parser.parse(bobson_string)
const serialized_color = serializer.serialize(parsed_color)

console.log('// output:', parsed_color)
console.log('// output:', serialized_color)
// output: #00ff00
// output: green
