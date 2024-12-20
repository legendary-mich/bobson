'use strict'

const {
  Object_Schema,
  Array_Schema,
  String_Schema,
  Enum_Schema,
  Integer_Schema,
  BigInt_Schema,
  Decimal_Schema,
} = require('./schemas.js')

const {
  assert,
  is_object,
  Duplicate_Key_Error,
  Duplicate_Schema_Error,
  Unknown_Schema_Error,
  Prefix_Error,
  General_Error,
} = require('./errors.js')

const {Bobson_Parser} = require('./bobson-parser.js')
const {Flat_Object_Parser} = require('./flat-object-parser.js')

class Bobson_Builder {
  constructor() {
    this.base_types = new Map()
    this.derived_types = new Map()
    this.parser_functions = new Map()
    this.serializer_functions = new Map()
    this.derived_types_being_defined = new Set()
    this.recursive_gaps = []
    this.schema_stack = []

    this.add_base_types({
      'string': (type, params) => {
        const [min, max] = params.slice(0, 2)
        const regex = params.slice(2).join('')
        return String_Schema.from_string_params(type, min, max, regex)
      },
      'enum': (type, params) => new Enum_Schema(type, params),
      'int_4': (type, params) => Integer_Schema.Int_4(type, ...params),
      'int_js': (type, params) => Integer_Schema.Int_Js(type, ...params),
      'int_8': (type, params) => BigInt_Schema.Int_8(type, ...params),
      'decimal': (type, params) => new Decimal_Schema(type, ...params),
    })

    this.add_parser_functions({
      bool: (r) => r === 'true' ? true : false,
    })

    this.add_serializer_functions({
      bool: (r) => '"' + r + '"',
    })

    this.add_derived_types({
      bool: 'enum true false',
    })
  }

  add_base_types(defs) {
    assert.object(defs)
    for (const [key, value] of Object.entries(defs)) {
      assert.function(value)
      this.base_types.set(key, value)
      this.base_types.set('?' + key, value)
    }
  }

  add_parser_functions(parser_functions) {
    assert.object(parser_functions)
    for (const [key, value] of Object.entries(parser_functions)) {
      assert.function(value)
      this.parser_functions.set(key, value)
    }
  }

  add_serializer_functions(serializer_functions) {
    assert.object(serializer_functions)
    for (const [key, value] of Object.entries(serializer_functions)) {
      assert.function(value)
      this.serializer_functions.set(key, value)
    }
  }

  add_derived_types(raw_definitions) {
    assert.object(raw_definitions)
    try {
      this.schema_stack = []
      this.recursive_gaps = []
      for (const [key, raw_def] of Object.entries(raw_definitions)) {
        this.schema_stack.push(key)
        if (key[0] === '?')
          throw new Prefix_Error(key[0], 'not ?')
        if (this.base_types.has(key) || this.derived_types.has(key))
          throw new Duplicate_Schema_Error(key)
        const nullable_key = '?' + key
        this.derived_types_being_defined.add(key)
        this.derived_types_being_defined.add(nullable_key)
        const new_schema = this.build_schema(raw_def, key)
        this.derived_types.set(key, new_schema)

        const new_n_schema = this.build_schema(raw_def, nullable_key)
        this.derived_types.set(nullable_key, new_n_schema)

        this.derived_types_being_defined.clear()
        this.schema_stack.pop()
      }

      for (const schema of this.recursive_gaps) {
        schema.fill_gaps_in_definitions(this.derived_types)
      }
      this.recursive_gaps = []
    }
    catch (err) {
      err.path = this.schema_stack.join('')
      throw err
    }
  }

  get_serializer(raw_schema) {
    return this.parse_schema(raw_schema)
  }

  serialize(raw_schema, body) {
    return this.get_serializer(raw_schema).serialize(body)
  }

  get_parser(raw_schema) {
    const parsed_schema = this.parse_schema(raw_schema)
    return new Bobson_Parser(parsed_schema)
  }

  parse_flat_object(raw_schema, flat_object) {
    assert.array(flat_object)
    const obj_schema = this.parse_schema(raw_schema)
    const parser = new Flat_Object_Parser(obj_schema)
    return parser.parse(flat_object)
  }

  parse_path_params(raw_schema, path_params) {
    assert.object(path_params)
    return this.parse_flat_object(raw_schema, Object.entries(path_params))
  }

  parse_query_string(raw_schema, query_string) {
    assert.string(query_string)
    const whatwgUrl = new URL(query_string, 'http://localhost/')
    const pairs = Array.from(whatwgUrl.searchParams)
    return this.parse_flat_object(raw_schema, pairs)
  }

  parse_schema(raw_schema) {
    try {
      this.schema_stack = []
      return this.build_schema(raw_schema)
    }
    catch (err) {
      err.path = this.schema_stack.join('')
      throw err
    }
  }

  /**
   * @private
   */
  build_schema(raw_schema, alt_key = null) {
    if (typeof raw_schema === 'string') {

      const custom_schema = this.derived_types.get(raw_schema)
      if (custom_schema) {
        return alt_key !== null ? custom_schema.clone(alt_key) : custom_schema
      }

      const parts = raw_schema.split(' ')

      const base_factory = this.base_types.get(parts[0])
      if (base_factory) {
        const base_schema = base_factory(alt_key ?? parts[0], parts.slice(1))
        base_schema.set_parser_fn(this.parser_functions)
        base_schema.set_serializer_fn(this.serializer_functions)
        return base_schema
      }

      if (this.derived_types_being_defined.has(raw_schema)) {
        return raw_schema
      }

      throw new Unknown_Schema_Error(raw_schema)
    }
    else if (is_object(raw_schema)) {
      let obj_type = alt_key
      const fields = new Map()
      const required_fields = []
      let recursive_spotted = false

      const get_field_name = (key) => {
        if (!/^[+-]$/.test(key[0]))
          throw new Prefix_Error(key, '+/-')
        const field_name = key.slice(2)
        if (fields.has(field_name))
          throw new Duplicate_Key_Error(field_name)
        return field_name
      }

      for (const [f, schema] of Object.entries(raw_schema)) {
        this.schema_stack.push('.' + f)
        if (f === '?') {
          assert.boolean(schema)
          if (schema === true) obj_type ??= '?object'
        }
        else if (f[0] === '<') {
          const source_schema_name = f.slice(2)
          const source_schema = this.derived_types.get(source_schema_name)
          if (!source_schema)
            throw new Unknown_Schema_Error(source_schema_name)
          assert.instance(source_schema, Object_Schema)
          assert.array(schema)
          for (const sk of schema) {
            const field_name = get_field_name(sk)
            const field_schema = source_schema.get_child_schema(field_name)
            fields.set(field_name, field_schema)
            if (sk[0] === '+') {
              required_fields.push(field_name)
            }
          }
        }
        else {
          const field_name = get_field_name(f)
          const child_schema = this.build_schema(schema)
          if (typeof child_schema === 'string') recursive_spotted = true
          fields.set(field_name, child_schema)
          if (f[0] === '+') {
            required_fields.push(field_name)
          }
        }
        this.schema_stack.pop()
      }
      obj_type ??= 'object'
      const obj_schema = new Object_Schema(obj_type, fields, required_fields)
      if (recursive_spotted) this.recursive_gaps.push(obj_schema)
      obj_schema.set_parser_fn(this.parser_functions)
      obj_schema.set_serializer_fn(this.serializer_functions)
      return obj_schema
    }
    else if (Array.isArray(raw_schema)) {
      const main_schema = raw_schema[0]
      if (/^\??array/.test(main_schema)) {
        this.schema_stack.push('[')
        const child_schema = this.build_schema(raw_schema[1])
        this.schema_stack.pop()
        const parts = main_schema.split(' ')
        const [min, max] = parts.slice(1)
        const arr_type = alt_key ?? parts[0]
        const arr_schema = Array_Schema.from_string_params(arr_type, min, max, child_schema)
        arr_schema.set_parser_fn(this.parser_functions)
        arr_schema.set_serializer_fn(this.serializer_functions)
        if (typeof child_schema === 'string') this.recursive_gaps.push(arr_schema)
        return arr_schema
      }
      else {
        throw new Unknown_Schema_Error(main_schema)
      }
    }
    else {
      throw new Unknown_Schema_Error(raw_schema)
    }
  }
}

module.exports = {
  Bobson_Builder,
}
