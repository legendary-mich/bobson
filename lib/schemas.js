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

const BASE_MIXINS = require('./base-mixins.js')

class Base_Schema {
  constructor(type, start_state, mixins) {
    assert.string(type)
    // assert.string(start_state) // for string constants
    assert.number(start_state) // for numeric constants
    assert.object(mixins)
    for (const mixin_name of ['parser_fn', 'serializer_fn']) {
      assert.field_type('function', mixins, mixin_name)
    }
    this.type = type
    this.start_state = start_state
    this.mixins = mixins
    this.is_nullable = type[0] === '?'
    this.opening_char = '^'
    this.closing_char = '^'
  }

  clone(type, mixins) { throw new Not_Implemented_Error() }
  create_result_container() { throw new Not_Implemented_Error() }

  get parser_fn() { return this.mixins.parser_fn }
  get serializer_fn() { return this.mixins.serializer_fn }
  fill_gaps_in_definitions() {}
  validate_raw(result) {}
  validate_parsed(result) {}

  parse(raw_result) {
    if (raw_result === null) {
      if (!this.is_nullable) throw new Validation_Error(this.type, 'null')
      return null
    }
    this.validate_raw(raw_result)
    const parsed_result = this.parser_fn(raw_result, this)
    this.validate_parsed(parsed_result)
    return parsed_result
  }

  serialize(value) {
    return value === null ? null :
      this.opening_char +
      this.serializer_fn(value, this) +
      this.closing_char
  }
}

class Object_Schema extends Base_Schema {
  constructor(type, mixins, fields, required_fields, defaults) {
    super(type, START_OBJECT, mixins)
    assert.instance(fields, Map)
    assert.array(required_fields)
    assert.object(defaults)
    for (const v of fields.values()) {
      if (typeof v !== 'string') {
        assert.instance(v, Base_Schema)
      }
    }
    this.opening_char = '{'
    this.closing_char = '}'
    this.fields = fields
    this.required_fields = required_fields
    this.defaults = defaults
  }

  clone(type, mixins) {
    assert.string(type)
    assert.object(mixins)
    const cloned = new Object_Schema(type, mixins, this.fields, this.required_fields, this.defaults)
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

  validate_raw(result) {
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

  constructor(type, start_state, mixins, min_length, max_length) {
    super(type, start_state, mixins)
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

  validate_raw(result) {
    super.validate_raw(result)
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

class Array_Schema extends Array_Like_Schema {

  static from_string_params(type, mixins, min_length, max_length, child_schema) {
    min_length = Array_Like_Schema.parse_length(type, 'min_length', min_length)
    max_length = Array_Like_Schema.parse_length(type, 'max_length', max_length)
    return new Array_Schema(type, mixins, min_length, max_length, child_schema)
  }

  constructor(type, mixins, min_length, max_length, child_schema) {
    super(type, START_ARRAY, mixins, min_length, max_length)
    if (typeof child_schema !== 'string') {
      assert.instance(child_schema, Base_Schema)
    }
    this.opening_char = '['
    this.closing_char = ']'
    this.child_schema = child_schema
  }

  clone(type, mixins) {
    assert.string(type)
    assert.object(mixins)
    const cloned = new Array_Schema(type, mixins, this.min_length, this.max_length, this.child_schema)
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
    const schema = new String_Schema('member-name', BASE_MIXINS.string, 0, 256)
    return schema
  }

  static from_string_params(type, mixins, min_length, max_length, regex) {
    min_length = Array_Like_Schema.parse_length(type, 'min_length', min_length)
    max_length = Array_Like_Schema.parse_length(type, 'max_length', max_length)
    try {
      regex = regex ? new RegExp(regex) : null
    }
    catch (err) {
      throw new Configuration_Error(type, 'regex', regex)
    }
    return new String_Schema(type, mixins, min_length, max_length, regex)
  }

  constructor(type, mixins, min_length, max_length, regex = null) {
    super(type, START_STRING, mixins, min_length, max_length)
    if (regex !== null) {
      assert.instance(regex, RegExp)
    }
    this.opening_char = '"'
    this.closing_char = '"'
    this.regex = regex
  }

  clone(type, mixins) {
    assert.string(type)
    assert.object(mixins)
    const cloned = new String_Schema(type, mixins, this.min_length, this.max_length, this.regex)
    return cloned
  }

  create_result_container() {
    return new String_Result(this)
  }

  validate_raw(result) {
    super.validate_raw(result)
    if (this.regex && !this.regex.test(result)) {
      throw new Validation_Error(this.type, 'does not match regex')
    }
  }
}

class Enum_Schema extends String_Schema {
  constructor(type, mixins, enums) {
    assert.array(enums)
    if (enums.length < 1) throw new Configuration_Error(type, 'enums', enums)
    let max_length = 0, min_length = Number.MAX_SAFE_INTEGER
    for (const e of enums) {
      if (e.length > max_length) max_length = e.length
      if (e.length < min_length) min_length = e.length
    }
    super(type, mixins, min_length, max_length)
    this.enums = new Set(enums)
  }

  clone(type, mixins) {
    assert.string(type)
    assert.object(mixins)
    const cloned = new Enum_Schema(type, mixins, Array.from(this.enums))
    return cloned
  }

  validate_raw(result) {
    super.validate_raw(result)
    if (!this.enums.has(result)) {
      throw new Validation_Error(this.type, result)
    }
  }
}

class Integer_Schema extends String_Schema {

  static regex = /^0$|^-?[1-9]\d*$/

  static parse_integer(type, mixins, label, value) {
    if (!Integer_Schema.regex.test(value))
      throw new Configuration_Error(type, label, value)
    return mixins.parser_fn(value)
  }

  static validate_min_bound(type, mixins, min_string, min_min_string) {
    min_string = min_string === 'min' ? min_min_string : min_string
    const min = Integer_Schema.parse_integer(type, mixins, 'min', min_string)
    const min_min = Integer_Schema.parse_integer(type, mixins, 'min_min', min_min_string)
    if (mixins.comparer_fn(min, min_min) < 0)
      throw new Configuration_Error(type, 'min', min_string, 'too small')
    return min_string
  }

  static validate_max_bound(type, mixins, max_string, max_max_string) {
    max_string = max_string === 'max' ? max_max_string : max_string
    const max = Integer_Schema.parse_integer(type, mixins, 'max', max_string)
    const max_max = Integer_Schema.parse_integer(type, mixins, 'max_max', max_max_string)
    if (mixins.comparer_fn(max, max_max) > 0)
      throw new Configuration_Error(type, 'max', max_string, 'too big')
    return max_string
  }

  static Int_4(type, mixins, min, max) {
    const min_min = '-2147483648'
    const max_max = '2147483647'
    min = Integer_Schema.validate_min_bound(type, mixins, min, min_min)
    max = Integer_Schema.validate_max_bound(type, mixins, max, max_max)
    return new Integer_Schema(type, mixins, min, max)
  }

  static Int_Js(type, mixins, min, max) {
    const min_min = '-9007199254740991'
    const max_max = '9007199254740991'
    min = Integer_Schema.validate_min_bound(type, mixins, min, min_min)
    max = Integer_Schema.validate_max_bound(type, mixins, max, max_max)
    return new Integer_Schema(type, mixins, min, max)
  }

  static Int_8(type, mixins, min, max) {
    const min_min = '-9223372036854775808'
    const max_max = '9223372036854775807'
    min = Integer_Schema.validate_min_bound(type, mixins, min, min_min)
    max = Integer_Schema.validate_max_bound(type, mixins, max, max_max)
    return new Integer_Schema(type, mixins, min, max)
  }

  constructor(type, mixins, min, max) {
    const regex = Integer_Schema.regex
    if (!regex.test(min)) throw new Configuration_Error(type, 'min', min)
    if (!regex.test(max)) throw new Configuration_Error(type, 'max', max)
    assert.field_type('function', mixins, 'comparer_fn')
    super(type, mixins, 0, Math.max(min.length, max.length), regex)
    this.min = mixins.parser_fn(min)
    this.max = mixins.parser_fn(max)
    this.min_string = min
    this.max_string = max
    if (this.comparer_fn(this.max, this.min) < 0)
      throw new Configuration_Error(type, 'max', max, 'max < min')
  }

  get comparer_fn() { return this.mixins.comparer_fn }

  clone(type, mixins) {
    assert.string(type)
    assert.object(mixins)
    const cloned = new Integer_Schema(type, mixins, this.min_string, this.max_string)
    return cloned
  }

  validate_parsed(result) {
    if (this.comparer_fn(result, this.min) < 0) {
      throw new Validation_Error(this.type, 'too small')
    }
    if (this.comparer_fn(result, this.max) > 0) {
      throw new Validation_Error(this.type, 'too big')
    }
  }
}

class Decimal_Schema extends String_Schema {

  static regex = /^0(\.\d+)?$|^-0\.0*[1-9]\d*$|^-?[1-9]\d*(\.\d+)?$/

  constructor(type, mixins, min, max) {
    const regex = Decimal_Schema.regex
    if (!regex.test(min)) throw new Configuration_Error(type, 'min', min)
    if (!regex.test(max)) throw new Configuration_Error(type, 'max', max)
    assert.field_type('function', mixins, 'comparer_fn')
    super(type, mixins, 0, Math.max(min.length, max.length), regex)
    this.min = mixins.parser_fn(min)
    this.max = mixins.parser_fn(max)
    this.min_string = min
    this.max_string = max
    if (mixins.comparer_fn(this.max, this.min) < 0)
      throw new Configuration_Error(type, 'max', max, 'max < min')
    if (max.split('.')[1]?.length !== min.split('.')[1]?.length) {
      throw new Configuration_Error(type, 'max', this.max_string, `The number of fractional digits should be the same in both the min/max bounds. The min bound is: ${min}`)
    }
    this.scale = max.split('.')[1]?.length ?? 0
  }

  get comparer_fn() { return this.mixins.comparer_fn }

  clone(type, mixins) {
    assert.string(type)
    assert.object(mixins)
    const cloned = new Decimal_Schema(type, mixins, this.min_string, this.max_string)
    return cloned
  }

  validate_raw(result) {
    super.validate_raw(result)
    const scale = result.split('.')[1]?.length ?? 0
    if (scale > this.scale) {
      throw new Validation_Error(this.type, 'fractional part too long')
    }
  }

  validate_parsed(result) {
    if (this.comparer_fn(result, this.min) < 0) {
      throw new Validation_Error(this.type, 'too small')
    }
    if (this.comparer_fn(result, this.max) > 0) {
      throw new Validation_Error(this.type, 'too big')
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
  Decimal_Schema,
}
