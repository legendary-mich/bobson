'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
// IMPORTANT! Serializer functions should be added before derived types.
bobson.add_serializer_functions({
  'color': (string) => {
    switch (string) {
    case '#ff0000': return 'red'
    case '#00ff00': return 'green'
    case '#0000ff': return 'blue'
    }},
})
bobson.add_derived_types({
  'color': 'enum red green blue',
})
const bobson_string = '#00ff00'
const serializer = bobson.get_serializer('color')
const parsed_color = serializer.serialize(bobson_string)

console.log('// output:', parsed_color)
// output: green
