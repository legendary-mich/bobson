'use strict'

const {
  Object_Schema,
  Array_Schema,
  String_Schema,
  Enum_Schema,
  Integer_Schema,
  Decimal_Schema,
} = require('./schemas.js')

const {
  assert,
  Duplicate_Key_Error,
  Duplicate_Schema_Error,
  Unknown_Schema_Error,
  Prefix_Error,
} = require('./errors.js')

const {Uniform_Map} = require('./uniform-map.js')
const {Bobson_Parser} = require('./bobson-parser.js')
const {Flat_Pairs_Parser} = require('./flat-pairs-parser.js')
const BASE_MIXINS = require('./base-mixins.js')

class Bobson_Builder {
  constructor() {
    this.mixins = new Uniform_Map()
    this.base_factories = new Uniform_Map()
    this.derived_types = new Map()
    this.derived_types_being_defined = new Set()
    this.recursive_gaps = []
    this.schema_stack = []

    this.mixins.set('array', BASE_MIXINS.array)
    this.mixins.set('object', BASE_MIXINS.object)

    this.add_base_type('string', BASE_MIXINS['string'], (type, mixins, params) => {
      const [min, max] = params.slice(0, 2)
      const regex = params.slice(2).join('')
      return String_Schema.from_string_params(type, mixins, min, max, regex)
    })
    this.add_base_type('enum', BASE_MIXINS['string'], (type, mixins, params) => {
      return new Enum_Schema(type, mixins, params)
    })
    this.add_base_type('int_4', BASE_MIXINS['number'], (type, mixins, params) => {
      return Integer_Schema.Int_4(type, mixins, ...params)
    })
    this.add_base_type('int_js', BASE_MIXINS['number'], (type, mixins, params) => {
      return Integer_Schema.Int_Js(type, mixins, ...params)
    })
    this.add_base_type('int_8', BASE_MIXINS['bigint'], (type, mixins, params) => {
      return Integer_Schema.Int_8(type, mixins, ...params)
    })
    this.add_base_type('decimal', BASE_MIXINS['big.js'], (type, mixins, params) => {
      return new Decimal_Schema(type, mixins, ...params)
    })

    this.add_derived_type('bool', 'enum true false', {
      parser_fn: (r) => r === 'true' ? true : false,
      serializer_fn: (r) => r + '',
    })
  }

  find_mixins(type, derive_from) {
    assert.string(type)
    assert.string(derive_from)
    const parent = this.mixins.get(derive_from)
    const child = this.mixins.get(type)
    assert.object(parent)
    return child ?? parent
  }

  override_mixins(key, mixins) {
    assert.string(key)
    assert.object(mixins)
    const base = this.mixins.get(key)
    if (!base) throw new Unknown_Schema_Error(key)
    for (const mixin_name of Object.keys(base)) {
      assert.field_type('function', mixins, mixin_name)
    }
    this.mixins.set(key, mixins)
  }

  add_base_type(key, mixins, factory_fn) {
    assert.string(key)
    assert.object(mixins)
    assert.function(factory_fn)
    for (const mixin_name of ['parser_fn', 'serializer_fn']) {
      assert.field_type('function', mixins, mixin_name)
    }
    this.mixins.set(key, mixins)
    this.base_factories.set(key, factory_fn)
  }

  // NOTE that most of the tests were written for the plural add_derived_type(s)
  // method. They incidentally cover this method, but if you remove the plural
  // one, the test coverage will disappear.
  add_derived_type(key, raw_def, mixins = null) {
    assert.string(key)
    if (mixins) assert.object(mixins)
    try {
      this.schema_stack = []
      this.recursive_gaps = []
      this.schema_stack.push(key)
      if (key[0] === '?')
        throw new Prefix_Error(key[0], 'not ?')
      if (this.base_factories.has(key) || this.derived_types.has(key))
        throw new Duplicate_Schema_Error(key)

      if (mixins) {
        // In case of doubly-derived types, I cannot check if the new mixins
        // have all the functions required by the parent type. This information
        // is only available while cloning, so the validation will be done
        // there.
        this.mixins.set(key, mixins)
      }

      const nullable_key = '?' + key
      this.derived_types_being_defined.add(key)
      this.derived_types_being_defined.add(nullable_key)
      const new_schema = this.build_schema(raw_def, key)
      this.derived_types.set(key, new_schema)

      const new_n_schema = this.build_schema(raw_def, nullable_key)
      this.derived_types.set(nullable_key, new_n_schema)

      this.derived_types_being_defined.clear()
      this.schema_stack.pop()

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

  add_derived_types(raw_definitions) {
    assert.object(raw_definitions)
    for (const [key, raw_def] of Object.entries(raw_definitions)) {
      this.add_derived_type(key, raw_def)
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

  parse(raw_schema, string) {
    const parser = this.get_parser(raw_schema)
    return parser.parse(string)
  }

  parse_flat_pairs(raw_schema, flat_object) {
    assert.array(flat_object)
    const obj_schema = this.parse_schema(raw_schema)
    const parser = new Flat_Pairs_Parser(obj_schema)
    return parser.parse(flat_object)
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
        if (alt_key !== null) {
          // An example scenario: If I derive from the 'bool' type, which in
          // turn derives from the 'enum' type, I need to override the 'bool'
          // mixins.
          const alt_mixins = this.mixins.get(alt_key)
          // TODO: When cloning a recursive type, the cloned schema should be
          // substituted in the entire tree. Once you have it working here,
          // consider reusing the solution in the add_derived_type method for
          // nullable types.
          return custom_schema.clone(alt_key, alt_mixins ?? custom_schema.mixins)
        }
        else {
          return custom_schema
        }
      }

      if (this.derived_types_being_defined.has(raw_schema)) {
        return raw_schema
      }

      const parts = raw_schema.split(' ')
      if (!this.base_factories.has(parts[0])) {
        throw new Unknown_Schema_Error(raw_schema)
      }
      return this.build_schema(parts, alt_key)
    }
    else if (Array.isArray(raw_schema)) {
      let compiled_schema = null
      const base_factory = this.base_factories.get(raw_schema[0])
      if (base_factory) {
        const type_name = alt_key ?? raw_schema[0]
        const mixins = this.find_mixins(type_name, raw_schema[0])
        compiled_schema = base_factory(type_name, mixins, raw_schema.slice(1))
      }
      else if (/^\??object$/.test(raw_schema[0])) {
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

        assert.object(raw_schema[1])
        for (const [f, schema] of Object.entries(raw_schema[1])) {
          this.schema_stack.push('.' + f)
          if (f[0] === '<') {
            const source_schema_name = f.slice(2)
            const source_schema = this.derived_types.get(source_schema_name)
            if (!source_schema)
              throw new Unknown_Schema_Error(source_schema_name)
            assert.instance(source_schema, Object_Schema)
            assert.array(schema)
            let previous = null
            const add_alias = (current) => {
              if (previous !== null && previous[0] !== '=') {
                const field_name = get_field_name(previous)
                const schema_name = current?.[0] === '=' ? current.slice(2) : field_name
                const field_schema = source_schema.get_child_schema(schema_name)
                fields.set(field_name, field_schema)
                if (previous[0] === '+') {
                  required_fields.push(field_name)
                }
              }
              else if (current?.[0] === '=') {
                throw new Prefix_Error(current, '+/-')
              }
              previous = current
            }
            for (const sk of schema) { add_alias(sk) }
            add_alias(null)
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
        const obj_type = alt_key ?? raw_schema[0]
        compiled_schema = new Object_Schema(obj_type, this.find_mixins(obj_type, 'object'), fields, required_fields, raw_schema[2] ?? {})
        if (recursive_spotted) this.recursive_gaps.push(compiled_schema)
      }
      else if (/^\??array/.test(raw_schema[0])) {
        this.schema_stack.push('[')
        const child_schema = this.build_schema(raw_schema[1])
        this.schema_stack.pop()
        const parts = raw_schema[0].split(' ')
        const [min, max, rest] = parts.slice(1)
        if (rest !== undefined) throw new Unknown_Schema_Error(raw_schema[0])
        const arr_type = alt_key ?? parts[0]
        compiled_schema = Array_Schema.from_string_params(arr_type, this.find_mixins(arr_type, 'array'), min, max, child_schema)
        if (typeof child_schema === 'string') this.recursive_gaps.push(compiled_schema)
      }
      else {
        throw new Unknown_Schema_Error(raw_schema[0])
      }
      return compiled_schema
    }
    else {
      throw new Unknown_Schema_Error(raw_schema)
    }
  }
}

module.exports = {
  Bobson_Builder,
}
