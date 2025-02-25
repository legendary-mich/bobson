'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
// Derived types can be added either one by one
bobson.add_derived_type('username', 'string 3 30') // new type
bobson.add_derived_type('password', 'string 5 24') // new type
// or in a batch
bobson.add_derived_types({
  'color'   : 'enum red green blue',               // new type
  'auth': ["object", {                             // new type
    '+ name' : 'username',                         // reference
    '+ pwd'  : 'password',                         // reference
    '- color': 'color',                            // reference
  }],
})
const bobson_string = '{"name":"bob","pwd":"qwerty"}'
const parsed_auth = bobson.parse('auth', bobson_string)
console.log('// output:', parsed_auth)
// output: { name: 'bob', pwd: 'qwerty' }
