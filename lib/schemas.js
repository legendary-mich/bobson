'use strict'

const {
  START_STRING,
  START_OBJECT,
  START_ARRAY,
} = require('./constants.js')

const {
  Object_Result,
  Array_Result,
  String_Result,
} = require('./result-containers.js')

const {
  assert,
  Not_Implemented_Error,
  Validation_Error,
  Configuration_Error,
  Unknown_Key_Error,
} = require('./errors.js')

const {Decimal} = require('./decimal.js')

class Base_Schema {
  constructor(type, start_state) {
    assert.string(type)
    // assert.string(start_state) // for string constants
    assert.number(start_state) // for numeric constants
    this.type = type
    this.start_state = start_state
    this.is_nullable = type[0] === '?'
    this.parser_fn = (r) => r
    // Use JSON.stringify to escape \ and " properly.
    this.serializer_fn = (r) => JSON.stringify(r)
  }

  clone(type) {
    throw new Not_Implemented_Error()
  }

  create_result_container() { throw new Not_Implemented_Error() }
  fill_gaps_in_definitions() {}

  get_non_nullable_type() {
    return this.type[0] === '?' ? this.type.slice(1): this.type
  }

  set_parser_fn(parser_functions) {
    const fn = parser_functions.get(this.get_non_nullable_type())
    if (fn) this.parser_fn = fn
  }

  parse(result) {
    this.validate(result)
    return result === null ? result : this.parser_fn(result)
  }

  set_serializer_fn(serializer_functions) {
    const fn = serializer_functions.get(this.get_non_nullable_type())
    if (fn) this.serializer_fn = fn
  }

  serialize(value) {
    return value === null ? null : this.serializer_fn(value)
  }

  validate(result) {
    if (result === null && !this.is_nullable) {
      throw new Validation_Error(this.type, 'null')
    }
  }
}

class Object_Schema extends Base_Schema {
  constructor(type, fields, required_fields, defaults) {
    super(type, START_OBJECT)
    assert.instance(fields, Map)
    assert.array(required_fields)
    assert.object(defaults)
    for (const v of fields.values()) {
      if (typeof v !== 'string') {
        assert.instance(v, Base_Schema)
      }
    }
    this.fields = fields
    this.required_fields = required_fields
    this.defaults = defaults

    this.serializer_fn = (object) => {
      let res = '{'
      let num_of_entries = 0
      for (const [key, val] of Object.entries(object)) {
        const schema = this.fields.get(key)
        if (schema) {
          const leading_coma = num_of_entries > 0 ? ',':''
          res += `${leading_coma}"${key}":${schema.serialize(val)}`
          ++num_of_entries
        }
      }
      res += '}'
      return res
    }
  }

  clone(type) {
    const cloned = new Object_Schema(type, this.fields, this.required_fields, this.defaults)
    cloned.parser_fn = this.parser_fn
    cloned.serializer_fn = this.serializer_fn
    return cloned
  }

  get_child_schema(key) {
    const child_schema = this.fields.get(key)
    if (!child_schema) {
      throw new Unknown_Key_Error(key)
    }
    return child_schema
  }

  create_result_container() {
    return new Object_Result()
  }

  fill_gaps_in_definitions(derived_types) {
    for (const [key, schema] of this.fields.entries()) {
      if (typeof schema === 'string') {
        const new_schema = derived_types.get(schema)
        assert.instance(new_schema, Base_Schema)
        this.fields.set(key, new_schema)
      }
    }
  }

  validate(result) {
    super.validate(result)
    if (result === null) return
    for (const [key, value] of Object.entries(this.defaults)) {
      if (!Object.hasOwn(result, key)) {
        result[key] = value
      }
    }
    for (const rf of this.required_fields) {
      if (!(Object.hasOwn(result, rf))) {
        throw new Validation_Error(this.type, `missing required field: ${rf}`)
      }
    }
  }
}

class Array_Like_Schema extends Base_Schema {

  static parse_length(type, label, value) {
    const natural_num_regex = /^0$|^[1-9]\d*$/
    if (!natural_num_regex.test(value))
      throw new Configuration_Error(type, label, value)
    return parseFloat(value)
  }

  constructor(type, start_state, min_length, max_length) {
    super(type, start_state)
    assert.number(min_length)
    assert.number(max_length)
    if (!Number.isSafeInteger(min_length) || min_length < 0)
      throw new Configuration_Error(type, 'min_length', min_length)
    if (!Number.isSafeInteger(max_length) || max_length < 0)
      throw new Configuration_Error(type, 'max_length', max_length)
    if (max_length < min_length)
      throw new Configuration_Error(type, 'max_length', max_length, 'max_length < min_length')
    this.min_length = min_length
    this.max_length = max_length
  }

  validate_max_length(length) {
    if (this.max_length < length) {
      throw new Validation_Error(this.type, 'too long')
    }
  }

  validate(result) {
    super.validate(result)
    if (result === null) return
    else {
      // The max_length validation is done separately. The reason is to have a
      // faster feedback for results that are too long.
      // if (this.max_length < result.length) {
      //   throw new Validation_Error(this.type, 'too long')
      // }
      if (this.min_length > result.length) {
        throw new Validation_Error(this.type, 'too short')
      }
    }
  }
}

class Array_Schema extends Array_Like_Schema {

  static from_string_params(type, min_length, max_length, child_schema) {
    min_length = Array_Like_Schema.parse_length(type, 'min_length', min_length)
    max_length = Array_Like_Schema.parse_length(type, 'max_length', max_length)
    return new Array_Schema(type, min_length, max_length, child_schema)
  }

  constructor(type, min_length, max_length, child_schema) {
    super(type, START_ARRAY, min_length, max_length)
    if (typeof child_schema !== 'string') {
      assert.instance(child_schema, Base_Schema)
    }
    this.child_schema = child_schema

    this.serializer_fn = (array) => {
      let res = '['
      let num_of_entries = 0
      const schema = this.child_schema
      for (const val of array) {
        const leading_coma = num_of_entries > 0 ? ',':''
        res += `${leading_coma}${schema.serialize(val)}`
        ++num_of_entries
      }
      res += ']'
      return res
    }
  }

  clone(type) {
    const cloned = new Array_Schema(type, this.min_length, this.max_length, this.child_schema)
    cloned.parser_fn = this.parser_fn
    cloned.serializer_fn = this.serializer_fn
    return cloned
  }

  create_result_container() {
    return new Array_Result(this)
  }

  fill_gaps_in_definitions(derived_types) {
    if (typeof this.child_schema === 'string') {
      this.child_schema = derived_types.get(this.child_schema)
      assert.instance(this.child_schema, Base_Schema)
    }
  }
}

class String_Schema extends Array_Like_Schema {

  static Object_Member_Name() {
    const schema = new String_Schema('member-name', 0, 256)
    return schema
  }

  static from_string_params(type, min_length, max_length, regex) {
    min_length = Array_Like_Schema.parse_length(type, 'min_length', min_length)
    max_length = Array_Like_Schema.parse_length(type, 'max_length', max_length)
    try {
      regex = regex ? new RegExp(regex) : null
    }
    catch (err) {
      throw new Configuration_Error(type, 'regex', regex)
    }
    return new String_Schema(type, min_length, max_length, regex)
  }

  constructor(type, min_length, max_length, regex = null) {
    super(type, START_STRING, min_length, max_length)
    if (regex !== null) {
      assert.instance(regex, RegExp)
    }
    this.regex = regex
  }

  clone(type) {
    const cloned = new String_Schema(type, this.min_length, this.max_length, this.regex)
    cloned.parser_fn = this.parser_fn
    cloned.serializer_fn = this.serializer_fn
    return cloned
  }

  create_result_container() {
    return new String_Result(this)
  }

  validate(result) {
    super.validate(result)
    if (result === null) return
    else {
      if (this.regex && !this.regex.test(result)) {
        throw new Validation_Error(this.type, 'does not match regex')
      }
    }
  }
}

class Enum_Schema extends String_Schema {
  constructor(type, enums) {
    assert.array(enums)
    if (enums.length < 1) throw new Configuration_Error(type, 'enums', enums)
    let max_length = 0, min_length = Number.MAX_SAFE_INTEGER
    for (const e of enums) {
      if (e.length > max_length) max_length = e.length
      if (e.length < min_length) min_length = e.length
    }
    super(type, min_length, max_length)
    this.enums = new Set(enums)
  }

  clone(type) {
    const cloned = new Enum_Schema(type, Array.from(this.enums))
    cloned.parser_fn = this.parser_fn
    cloned.serializer_fn = this.serializer_fn
    return cloned
  }

  validate(result) {
    super.validate(result)
    if (result === null) return
    if (!this.enums.has(result)) {
      throw new Validation_Error(this.type, result)
    }
  }
}

class Integer_Schema extends String_Schema {

  static regex = /^0$|^-?[1-9]\d*$/

  static parse_integer(type, label, value) {
    if (!Integer_Schema.regex.test(value))
      throw new Configuration_Error(type, label, value)
    return parseFloat(value)
  }

  static from_string_params(type, min, max, min_min, max_max) {
    min = min === 'min' ? min_min : min
    max = max === 'max' ? max_max : max
    min = Integer_Schema.parse_integer(type, 'min', min)
    max = Integer_Schema.parse_integer(type, 'max', max)
    if (min < parseFloat(min_min))
      throw new Configuration_Error(type, 'min', min, 'too small')
    if (max > parseFloat(max_max))
      throw new Configuration_Error(type, 'max', max, 'too big')
    const schema = new Integer_Schema(type, min, max)
    return schema
  }

  static Int_4(type, min, max) {
    const min_min = '-2147483648'
    const max_max = '2147483647'
    return Integer_Schema.from_string_params(type, min, max, min_min, max_max)
  }

  static Int_Js(type, min, max) {
    const min_min = '-9007199254740991'
    const max_max = '9007199254740991'
    return Integer_Schema.from_string_params(type, min, max, min_min, max_max)
  }

  constructor(type, min, max) {
    super(type, 0, Math.max((''+min).length, (''+max).length), Integer_Schema.regex)
    assert.number(min)
    assert.number(max)
    if (max < min)
      throw new Configuration_Error(type, 'max', max, 'max < min')
    this.min = min
    this.max = max

    this.temp_number = 0
    this.parser_fn = () => this.temp_number
    this.serializer_fn = (r) => '"' + r + '"'
  }

  clone(type) {
    const cloned = new Integer_Schema(type, this.min, this.max)
    cloned.parser_fn = this.parser_fn
    cloned.serializer_fn = this.serializer_fn
    return cloned
  }

  validate(result) {
    super.validate(result)
    if (result === null) return
    else {
      this.temp_number = parseFloat(result)
      if (this.temp_number < this.min) {
        throw new Validation_Error(this.type, 'too small')
      }
      if (this.temp_number > this.max) {
        throw new Validation_Error(this.type, 'too big')
      }
    }
  }
}

class BigInt_Schema extends String_Schema {

  static regex = /^0$|^-?[1-9]\d*$/

  static parse_integer(type, label, value) {
    if (!BigInt_Schema.regex.test(value))
      throw new Configuration_Error(type, label, value)
    return BigInt(value)
  }

  static from_string_params(type, min, max, min_min, max_max) {
    min = min === 'min' ? min_min : min
    max = max === 'max' ? max_max : max
    min = BigInt_Schema.parse_integer(type, 'min', min)
    max = BigInt_Schema.parse_integer(type, 'max', max)
    if (min < BigInt(min_min))
      throw new Configuration_Error(type, 'min', min, 'too small')
    if (max > BigInt(max_max))
      throw new Configuration_Error(type, 'max', max, 'too big')
    const schema = new BigInt_Schema(type, min, max)
    return schema
  }

  static Int_8(type, min, max) {
    const min_min = '-9223372036854775808'
    const max_max = '9223372036854775807'
    return BigInt_Schema.from_string_params(type, min, max, min_min, max_max)
  }

  constructor(type, min, max) {
    super(type, 0, Math.max((''+min).length, (''+max).length), BigInt_Schema.regex)
    assert.bigint(min)
    assert.bigint(max)
    if (min > max)
      throw new Configuration_Error(type, 'max', max, 'max < min')
    this.min = min
    this.max = max

    this.temp_number = 0n
    this.parser_fn = () => this.temp_number
    this.serializer_fn = (r) => '"' + r + '"'
  }

  clone(type) {
    const cloned = new BigInt_Schema(type, this.min, this.max)
    cloned.parser_fn = this.parser_fn
    cloned.serializer_fn = this.serializer_fn
    return cloned
  }

  validate(result) {
    super.validate(result)
    if (result === null) return
    else {
      this.temp_number = BigInt(result)
      if (this.temp_number < this.min) {
        throw new Validation_Error(this.type, 'too small')
      }
      if (this.temp_number > this.max) {
        throw new Validation_Error(this.type, 'too big')
      }
    }
  }
}

class Decimal_Schema extends String_Schema {

  static regex = /^0(\.\d+)?$|^-0\.\d*[1-9]\d*$|^-?[1-9]\d*(\.\d+)?$/

  constructor(type, min, max) {
    if (!Decimal_Schema.regex.test(min))
      throw new Configuration_Error(type, 'min', min)
    if (!Decimal_Schema.regex.test(max))
      throw new Configuration_Error(type, 'max', max)
    super(type, 0, Math.max(min.length, max.length), Decimal_Schema.regex)
    this.min = new Decimal(min)
    this.max = new Decimal(max)
    if (this.max.fractional_part.length !== this.min.fractional_part.length) {
      throw new Configuration_Error(type, 'max', this.max.string, `The number of fractional digits should be the same in both the min/max bounds. The min bound is: ${this.min.string}`)
    }
    if (this.min.greater_than(
      this.max.sign, this.max.integer_part, this.max.fractional_part)
    ) throw new Configuration_Error(type, 'max', max, 'max < min')
    this.scale = this.max.fractional_part.length
  }

  clone(type) {
    const cloned = new Decimal_Schema(type, this.min.string, this.max.string)
    cloned.parser_fn = this.parser_fn
    cloned.serializer_fn = this.serializer_fn
    return cloned
  }

  validate(result) {
    super.validate(result)
    if (result === null) return
    else {
      const [sign, integer_part, fractional_part] = Decimal.split_string(result)

      if (fractional_part.length > this.scale) {
        throw new Validation_Error(this.type, 'fractional part too long')
      }

      if (this.min.greater_than(sign, integer_part, fractional_part)) {
        throw new Validation_Error(this.type, 'too small')
      }
      if (this.max.smaller_than(sign, integer_part, fractional_part)) {
        throw new Validation_Error(this.type, 'too big')
      }
    }
  }
}

const member_name_schema = String_Schema.Object_Member_Name()

module.exports = {
  member_name_schema,
  Base_Schema,
  Object_Schema,
  Array_Schema,
  String_Schema,
  Enum_Schema,
  Integer_Schema,
  BigInt_Schema,
  Decimal_Schema,
}
