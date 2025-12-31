# bobson

*A message format for the web in XXI century... with terse schemas BTW.*

- [bobson what?](#bobson-what)
- [Short example](#short-example)
- [Basic Types](#basic-types)
- [Nullable Types](#nullable-types)
- [Derived Types](#derived-types)
  + [Object Inheritance](#object-inheritance-)
  + [Object Defaults](#object-defaults)
  + [Recursive Types](#recursive-types)
  + [Custom Parsers/Serializers](#custom-parsersserializers-in-derived-types)
- [Overriding base Parsers/Serializers](#overriding-base-parsersserializers)
- [Adding new base types](#adding-new-base-types)
- [Parsing](#parsing)
  + [bobson.parse(schema, message)](#bobsonparseschema-message)
  + [bobson.get_parser(schema).parse(message)](#bobsonget_parserschemaparsemessage)
  + [bobson.get_parser(schema).parse_chunk(message)](#bobsonget_parserschemaparse_chunkmessage)
  + [bobson.parse_flat_pairs(schema, array)](#bobsonparse_flat_pairsschema-array)
- [Serializing](#serializing)
  + [bobson.serialize(schema, payload)](#bobsonserializeschema-payload)
  + [bobson.get_serializer(schema).serialize(payload)](#bobsonget_serializerschemaserializepayload)
- [Versioning](#versioning)
- [Contributing](#contributing)


## bobson what?

#### What is bobson?
Bobson is a message format built on top of JSON.

#### How is bobson different from JSON?
- Bobson requires bobson **schemas** to work.
- Every data type in a bobson message (except for `objects`, `arrays`, and `nulls`) is carried by a `string`. 
- Whitespace characters between separators are not allowed.
- Unicode characters have to be passed literally, e.g. 😅. Notation like "\ud83d\ude05" have no special meaning. 
- Every bobson message is a valid JSON, but not every JSON message is a valid bobson.

#### What is a bobson schema?
Bobson schema is a JSON describing the shape of a bobson message.

#### What does the bobson parser do?
bobson parser does two things. It parses, and validates a bobson message.

#### Can a bobson message be parsed in chunks?
Yes.

#### Is bobson parser immune to prototype pollution?
It rejects messages with fields not defined in the schema. So, the prototype pollution is opt-in rather than opt out.

## Short example
```javascript
const {Bobson_Builder} = require('bobson')
const bobson = new Bobson_Builder()
const user_schema = ["object", {
  '+ name'  : 'string 3 12',   // + means required
  '- age'   : 'int_4 0 120',   // - means optional
  '- height': '?int_4 30 220', // ? means nullable
  '+ gender': '?bool',         // gender is required and nullable
}]
const bobson_message = '{"name":"bob","age":"25","gender":null}'
const parsed_user = bobson.parse(user_schema, bobson_message)
console.log('// output:', parsed_user)
// output: { name: 'bob', age: 25, gender: null }
```

## Basic Types
```javascript
const string   = 'string 0 2' // min-length: 0, max-length: 2 (measured in code units)
const regex    = 'string 0 2 ^ab$'
const enum_a   = 'enum red green blue'
const enum_b   = ['enum', 'red', 'green', 'blue'] // same as above
const bool     = 'bool'
const int_4_a  = 'int_4 -10 max' // min: -10, max: 2147483647
const int_4_b  = 'int_4 min 10' // min: -2147483648, max: 10
const int_js_a = 'int_js -10 max' // min: -10, max: 9007199254740991
const int_js_b = 'int_js min 10' // min: -9007199254740991, max: 10
const int_8_a  = 'int_8 -10 max' // min: -10n, max: 9223372036854775807n
const int_8_b  = 'int_8 min 10' // min: -9223372036854775808n, max: 10n
const decimal  = 'decimal -2.23 9.99' // max-number-of-decimal-digits: 2
const array    = ['array 0 5', 'string 0 2'] // min-length: 0, max-length: 5
const object   = ["object", {
  '+ name'    : 'string 3 12', // name is required (+)
  '+ password': 'string 6 12', // password is required (+)
  '- age'     : 'int_4 0 120', // age is optional (-)
}]
```

## Nullable Types
Nullable types are created by prepending a basic type with a question mark.
```javascript
const string      = '?string 0 2'
const regex       = '?string 0 2 ^ab$'
const enumeration = '?enum red green blue'
const bool        = '?bool'
const int_4       = '?int_4 -10 10'
const int_js      = '?int_js -10 10'
const int_8       = '?int_8 -10 10'
const decimal     = '?decimal -2.23 9.99'
const array       = ['?array 0 5', 'string 0 2']
const object      = ["?object", { // nullable
  '+ name'    : '?string 3 12',   // nullable
  '+ password': 'string 6 12',
  '- age'     : '?int_4 0 120',   // nullable
  '- height'  : 'int_4 0 120',
}]
```

## Derived Types
```javascript
const {Bobson_Builder} = require('bobson')
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
```

### Object Inheritance (<)
```javascript
const {Bobson_Builder} = require('bobson')
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
      "- n_height", "= ?height", // n_height becomes a nullable version of the height
    ],
  }],
})
const bobson_string = '{"id":"2","job":"cook","name":"bob","height":"180","n_height":null,"user_id":"3"}'
const parsed_employee = bobson.parse('employee', bobson_string)
console.log('// output:', parsed_employee)
// output: { id: 2n, job: 'cook', name: 'bob', height: 180, n_height: null, user_id: 3 }
```

### Object Defaults
```javascript
const {Bobson_Builder} = require('bobson')
const bobson = new Bobson_Builder()
bobson.add_derived_types({
  "user": ["object", {
    "+ id": "int_4 0 max",
    "- name": "string 1 10",
    "- height": "int_4 0 230",
  }, {
    "name": "john", // default string
    "height": "2", // default int (comes as a string)
  }],
})
const bobson_string = '{"id":"2"}'
const parsed_user = bobson.parse('user', bobson_string)
console.log('// output:', parsed_user)
// output: { id: 2, name: 'john', height: 2 }
```

Default values always come as a 'string', and are not supported for object and array types.

### Recursive Types
With objects and arrays, recursive types can be declared. Be aware that recursive types can be infinitely deep. Currently there's no mechanism that would protect from infinitely deep structures.
```javascript
const {Bobson_Builder} = require('bobson')
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
```

### Custom Parsers/Serializers in derived types
```javascript
const {Bobson_Builder} = require('bobson')
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

## Overriding base Parsers/Serializers
```javascript
const {Bobson_Builder} = require('bobson')
const bobson = new Bobson_Builder()
bobson.override_mixin('decimal', {
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

## Adding new base types
In addition to the predefined base types, new base types can be added with the `add_base_type(key, mixin, factory_fn)` method of the `Bobson_Builder`class . For further instructions, look at the `Bobson_Builder` class to see how the predefined base types are created.

## Parsing
Parsers do 2 things:
- They parse bobson messages.
- They validate them, throwing an error if the message does not fit the schema.

### bobson.parse(schema, message)
```javascript
const {Bobson_Builder} = require('bobson')
const bobson = new Bobson_Builder()
const parsed_message = bobson.parse("string 0 10", '"lolo"')
console.log('// output:', parsed_message)
// output: lolo
```

### bobson.get_parser(schema).parse(message)
```javascript
const {Bobson_Builder} = require('bobson')
const bobson = new Bobson_Builder()
const parser = bobson.get_parser("string 0 10")
const parsed_message = parser.parse('"lolo"')
console.log('// output:', parsed_message)
// output: lolo
```

### bobson.get_parser(schema).parse_chunk(message)
```javascript
const {Bobson_Builder} = require('bobson')
const bobson = new Bobson_Builder()
const parser = bobson.get_parser("string 0 10")
parser.parse_chunk('"john w')
parser.parse_chunk('ayne"')
const parsed_messaeg = parser.get_result()
console.log('// output:', parsed_messaeg)
// output: john wayne
```

### bobson.parse_flat_pairs(schema, array)
```javascript
const {Bobson_Builder} = require('bobson')
const bobson = new Bobson_Builder()
const schema = ["object", {
  '+ id': 'int_js 1 max',
  '+ values': ['array 0 3', 'int_4 0 20'],
}]
const parsed_pairs = bobson.parse_flat_pairs(schema, [['id', '200'],['values', '2,3,4']])
console.log('// output:', parsed_pairs)
// output: { id: 200, values: [ 2, 3, 4 ] }
```

## Serializing
Serializers take data and convert it to a bobson message. They do not validate the received data. They assume that the data is of the declared type.
- They do not complain if a field of an object is missing.
- They ignore fields of an object that are not declared in the schema.
```javascript
const {Bobson_Builder} = require('bobson')
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
```

### bobson.serialize(schema, payload)
### bobson.get_serializer(schema).serialize(payload)


## Versioning
The package follows **Semantic Versioning**, which means that given a version number `MAJOR.MINOR.PATCH`, the components will be incremented as follows:
1. `MAJOR` version when making incompatible API changes
2. `MINOR` version when adding functionality in a backward compatible manner
3. `PATCH` version when making backward compatible bug fixes

## Contributing
By contributing your code to this project, you agree to license your contribution under the MIT license.
