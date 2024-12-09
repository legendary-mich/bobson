'use strict'

// If you want to use the string constants, you will have to change the
// start_state assertion in the Base_Schema constructor.

// const LITERAL = 'literal'
// const START_STRING = 'start-string'
// const STRING = 'string'

// const START_OBJECT = 'start-object'
// const END_OBJECT_OR_MEMBER = 'end-object-or-member'
// const MEMBER_NAME = 'member-name'
// const MEMBER_COLON = 'member-colon'
// const MEMBER_VALUE = 'member-value'
// const END_OBJECT_OR_COMMA = 'end-object-or-comma'

// const START_ARRAY = 'start-array'
// const END_ARRAY_OR_VALUE = 'end-array-or-value'
// const ARRAY_VALUE = 'array-value'
// const END_ARRAY_OR_COMMA = 'end-array-or-comma'

// const END = 'end'

const LITERAL = 1
const START_STRING = 2
const STRING = 3

const START_OBJECT = 4
const END_OBJECT_OR_MEMBER = 5
const MEMBER_NAME = 6
const MEMBER_COLON = 7
const MEMBER_VALUE = 8
const END_OBJECT_OR_COMMA = 9

const START_ARRAY = 10
const END_ARRAY_OR_VALUE = 11
const ARRAY_VALUE = 12
const END_ARRAY_OR_COMMA = 13

const END = 14

module.exports = {
  LITERAL,
  START_STRING,
  STRING,

  START_OBJECT,
  END_OBJECT_OR_MEMBER,
  MEMBER_NAME,
  MEMBER_COLON,
  MEMBER_VALUE,
  END_OBJECT_OR_COMMA,

  START_ARRAY,
  ARRAY_VALUE,
  END_ARRAY_OR_VALUE,
  END_ARRAY_OR_COMMA,

  END,
}
