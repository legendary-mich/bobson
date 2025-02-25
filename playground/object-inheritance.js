'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_derived_types({
  "user": ["object", {
    "+ id": "int_4 0 max",
    "- name": "string 1 10",
    "- height": "int_4 0 230",
  }],
  "employee": ["object", {
    "+ id": "int_8 0 max",
    "+ job": "string 0 20",
    "< user": [            // Inherit the user_id, name, and height from the user
      "+ user_id", "= id", // with the user_id being an alias for the user.id
      "+ name",            // Note, that the name becomes required here
      "- height",
    ],
  }],
})
const bobson_string = '{"id":"2","job":"cook","name":"bob","height":"180","user_id":"3"}'
const parsed_employee = bobson.parse('employee', bobson_string)
console.log('// output:', parsed_employee)
// output: { id: 2n, job: 'cook', name: 'bob', height: 180, user_id: 3 }
