'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const serializer = bobson.get_serializer(["object", {
  "+ name": "string 1 4",
  "+ age": "int_4 0 100",
  "+ height": "int_4 30 230", // will not complain about the missing height
}])
const serialized_object = serializer.serialize({
  name: "john",
  age: 50,
  email: "john@wayne.com", // will be ignored, cause it's not in the schema
})
console.log('// output:', serialized_object)
// output: {"name":"john","age":"50"}
