'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const serializer = bobson.get_serializer("int_4 0 10")
const serialized_int = serializer.serialize(4)

console.log('// output:', serialized_int)
// output: "4"
