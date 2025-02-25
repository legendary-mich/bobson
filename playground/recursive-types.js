'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_derived_types({
  'tree': ["object", {
    "+ id": "int_js 0 max",
    "- node": "tree",
  }],
})
const bobson_string = '{"id":"100","node":{"id":"200","node":{"id":"300"}}}'
const parsed_tree = bobson.parse('tree', bobson_string)
console.log('// output:', parsed_tree)
// output: { id: 100, node: { id: 200, node: { id: 300 } } }
