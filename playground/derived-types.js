'use strict'

const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_derived_types({
  'username': 'string 3 30 ^\\S.*\\S$',
  'password': 'string 5 24',
  'color': 'enum red green blue',
  'auth': {
    '+ username': 'username',
    '+ password': 'password',
  },
})
const bobson_string = '{"username":"bob","password":"qwerty"}'
const parser = bobson.get_parser('auth')
const parsed_auth = parser.parse(bobson_string)

console.log('// output:', parsed_auth)
// output: { username: 'bob', password: 'qwerty' }
