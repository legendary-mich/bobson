# bobson

## TL;DR
```javascript
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const user_schema = ["object", {
  '+ name'   : 'string 3 12', // required
  '- age'    : 'int_4 0 120', // optional
  '- height' : '?int_4 30 220', // nullable
}]
const bobson_string = '{"name":"bob","age":"25","height":"180"}'
const parser = bobson.get_parser(user_schema)
const parsed_user = parser.parse(bobson_string)

console.log('// output:', parsed_user)
// output: { name: 'bob', age: 25, height: 180 }
```

## Basic Types
```javascript
const string         = 'string 0 2'
const regex          = 'string 0 2 ^ab$'
const enumeration    = 'enum red green blue'
const enum_in_arr    = ['enum', 'red', 'green', 'blue'] // same as above
const int_4          = 'int_4 -10 10'
const int_4_min_max  = 'int_4 min max' // [-2147483648, 2147483647]
const int_js         = 'int_js -10 10'
const int_js_min_max = 'int_js min max' // [-9007199254740991, 9007199254740991]
const int_8          = 'int_8 -10 10'
const int_8_min_max  = 'int_8 min max' // [-9223372036854775808, 9223372036854775807]
const decimal        = 'decimal -2.23 9.99'
const array          = ['array 0 5', 'string 0 2']
const object         = ["object", {
  '+ name'    : 'string 3 12', // required
  '+ password': 'string 6 12', // required
  '- age'     : 'int_4 0 120', // optional
}]
```
## Nullable Types
```javascript
const string      = '?string 0 2'
const regex       = '?string 0 2 ^ab$'
const enumeration = '?enum red green blue'
const int_4       = '?int_4 -10 10'
const int_js      = '?int_js -10 10'
const int_8       = '?int_8 -10 10'
const decimal     = '?decimal -2.23 9.99'
const array       = ['?array 0 5', 'string 0 2']
const object      = ["?object", { // object nullable as a whole
  '+ name'    : '?string 3 12', // required, nullable
  '+ password': 'string 6 12', // required, non-nullable
  '- age'     : '?int_4 0 120', // optional, nullable
  '- height'  : 'int_4 0 120', // optional, non-nullable
}]
```
## Derived Types
```javascript
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_derived_types({
  'username': 'string 3 30 ^\\S.*\\S$',
  'password': 'string 5 24',
  'color': 'enum red green blue',
  'auth': ["object", {
    '+ username': 'username',
    '+ password': 'password',
  }],
})
const bobson_string = '{"username":"bob","password":"qwerty"}'
const parser = bobson.get_parser('auth')
const parsed_auth = parser.parse(bobson_string)

console.log('// output:', parsed_auth)
// output: { username: 'bob', password: 'qwerty' }
```

### Object Inheritance
```javascript
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
    "< user": [            // inherit the user_id, name, and height from the user
      "+ user_id", "= id", // with the user_id being an alias for user.id
      "+ name",
      "- height",
    ],
  }],
})
const bobson_string = '{"id":"2","job":"cook","name":"bob","height":"180","user_id":"3"}'
const parser = bobson.get_parser('employee')
const parsed_employee = parser.parse(bobson_string)

console.log('// output:', parsed_employee)
// output: { id: 2n, job: 'cook', name: 'bob', height: 180, user_id: 3 }
```

### Object Defaults
```javascript
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_derived_types({
  "user": ["object", {
    "+ id": "int_4 0 max",
    "- name": "string 1 10",
    "- height": "int_4 0 230",
  }, {
    "name": "john", // default value
  }],
})
const bobson_string = '{"id":"2"}'
const parser = bobson.get_parser('user')
const parsed_user = parser.parse(bobson_string)

console.log('// output:', parsed_user)
// output: { id: 2, name: 'john' }
```

## Overriding base Parsers/Serializers
```javascript
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.override_mixins('decimal', {
  parser_fn: parseFloat,
  serializer_fn: (r) => r * 2,
  comparer_fn: (a, b) => a > b ? 1 : a === b ? 0 : -1,
})
const bobson_string = '"12.3"'
const parser = bobson.get_parser('decimal 0.0 100.0')
const serializer = bobson.get_serializer('decimal 0.0 100.0')
const parsed_val = parser.parse(bobson_string)
const serialized_val = serializer.serialize(parsed_val)

console.log('// output:', parsed_val)
console.log('// output:', serialized_val)
// output: 12.3
// output: 24.6
```
Note that **base mixins** should be overridden before adding **derived types**. Otherwise the derived types will not receive the overridden mixins. 

## Adding Parsers/Serializers for derived types
```javascript
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
```

## parse
```javascript
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const user_schema = ["object", {
  '+ name'   : 'string 3 12',
  '- age'    : 'int_4 0 120',
  '- height' : '?int_4 30 220',
}]
const parser = bobson.get_parser(user_schema)
const parsed_user = parser.parse('{"name":"bob","age":"25","height":"180"}')

console.log('// output:', parsed_user)
// output: { name: 'bob', age: 25, height: 180 }
```
## parse_chunk
```javascript
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const user_schema = ["object", {
  '+ name'   : 'string 3 12',
  '- age'    : 'int_4 0 120',
  '- height' : '?int_4 30 220',
}]
const parser = bobson.get_parser(user_schema)
parser.parse_chunk('{"name":"bob"')
parser.parse_chunk(',"age":"25","')
parser.parse_chunk('height":"180"}')
const parsed_user = parser.get_result()

console.log('// output:', parsed_user)
// output: { name: 'bob', age: 25, height: 180 }
```
## serialize
```javascript
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const serializer = bobson.get_serializer("int_4 0 10")
const serialized_int = serializer.serialize(4)

console.log('// output:', serialized_int)
// output: "4"
```
## add_base_types
**TODO: TBD**

## parse_flat_pairs
```javascript
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
const schema = ["object", {
  '+ id': 'int_js 1 max',
  '+ values': ['array 0 3', 'int_4 0 20'],
}]
const parsed_pairs = bobson.parse_flat_pairs(schema, [['id', '200'],['values', '2,3,4']])

console.log('// output:', parsed_pairs)
// output: { id: 200, values: [ 2, 3, 4 ] }
```
