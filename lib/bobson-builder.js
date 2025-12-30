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
  Unknown_Schema_Error,
} = require('./errors.js')

const {Uniform_Map} = require('./uniform-map.js')
const {Bobson_Parser} = require('./bobson-parser.js')
const {Flat_Pairs_Parser} = require('./flat-pairs-parser.js')
const BASE_MIXINS = require('./base-mixins.js')
const {Raw_Schema_Parser} = require('./raw-schema-parser.js')
const {string_factory, number_factory, enum_factory} = require('./raw-factories.js')

/**
 * @typedef {string|Array<*>} Raw_Schema
 */

/**
 * @typedef {Object<string,function>} Mixin
 */

class Bobson_Builder {
  constructor() {
    this.mixins = new Uniform_Map()
    this.base_factories = new Uniform_Map()
    this.derived_types = new Map()
    this.schema_stack = []

    this.raw_schema_parser = new Raw_Schema_Parser()

    this.mixins.set('array', BASE_MIXINS.array)
    this.mixins.set('object', BASE_MIXINS.object)

    this.add_base_type('string', BASE_MIXINS['string'], string_factory, (type, mixin) => {
      return String_Schema.from_string_params(
        type.alias, mixin, type.min, type.max, type.regex)
    })
    this.add_base_type('enum', BASE_MIXINS['string'], enum_factory, (type, mixin) => {
      return new Enum_Schema(type.alias, mixin, type.values)
    })
    this.add_base_type('int_4', BASE_MIXINS['number'], number_factory, (type, mixin) => {
      return Integer_Schema.Int_4(type.alias, mixin, type.min, type.max)
    })
    this.add_base_type('int_js', BASE_MIXINS['number'], number_factory, (type, mixin) => {
      return Integer_Schema.Int_Js(type.alias, mixin, type.min, type.max)
    })
    this.add_base_type('int_8', BASE_MIXINS['bigint'], number_factory, (type, mixin) => {
      return Integer_Schema.Int_8(type.alias, mixin, type.min, type.max)
    })
    this.add_base_type('decimal', BASE_MIXINS['big.js'], number_factory, (type, mixin) => {
      return new Decimal_Schema(type.alias, mixin, type.min, type.max)
    })

    this.add_derived_type('bool', 'enum true false', {
      parser_fn: (r) => r === 'true' ? true : false,
      serializer_fn: (r) => r + '',
    })
  }

  /**
   * @param {Raw_Type} type
   * @returns {Mixin}
   */
  find_mixin(type) {
    assert.object(type)
    return this.mixins.get(type.alias) ??
      // this.mixins.get(type.type) ?? // Uniform_Map removes the ? prefix anyway
      this.mixins.get(type.base_type) ??
      null
  }

  /**
   * @param {string} key
   * @param {Mixin} mixin
   * @returns {undefined}
   */
  override_mixin(key, mixin) {
    assert.string(key)
    assert.object(mixin)
    const base = this.mixins.get(key)
    if (!base) throw new Unknown_Schema_Error(key)
    for (const mixin_name of Object.keys(base)) {
      assert.field_type('function', mixin, mixin_name)
    }
    this.mixins.set(key, mixin)
  }

  /**
   * @param {string} key
   * @param {Mixin} mixin
   * @param {function(...string): Raw_Type} raw_factory_fn
   * @param {function(string, Mixin, Array<*>): Base_Schema} factory_fn
   * @returns {undefined}
   */
  add_base_type(key, mixin, raw_factory_fn, factory_fn) {
    assert.string(key)
    assert.object(mixin)
    for (const mixin_name of ['parser_fn', 'serializer_fn']) {
      assert.field_type('function', mixin, mixin_name)
    }
    this.mixins.set(key, mixin)
    this.raw_schema_parser.add_base_type(key, raw_factory_fn)
    assert.function(factory_fn)
    this.base_factories.set(key, factory_fn)
  }

  // NOTE that most of the tests were written for the plural add_derived_type(s)
  // method. They incidentally cover this method, but if you remove the plural
  // one, the test coverage will disappear.
  /**
   * @param {string} key
   * @param {Raw_Schema} raw_schema
   * @param {Mixin|null} mixin
   * @returns {undefined}
   */
  add_derived_type(key, raw_schema, mixin = null) {
    assert.string(key)
    if (mixin) assert.object(mixin)
    try {
      this.schema_stack = []
      this.raw_schema_parser.schema_stack = []
      this.schema_stack.push(key)
      if (mixin) {
        // In case of doubly-derived types, I cannot check if the new mixin
        // have all the functions required by the parent type. This information
        // is only available while cloning, so the validation will be done
        // there.
        this.mixins.set(key, mixin)
      }

      const type = this.raw_schema_parser.add_derived_type(key, raw_schema)
      mixin = this.find_mixin(type)

      const n_key = '?' + key
      if (type.base_type === 'object') {
        const fields = new Map()
        const schema = new Object_Schema(
          type.alias, mixin, fields, type.required_fields, type.defaults)
        const n_schema = schema.clone_as_nullable()
        // First add the types to derived_types
        this.derived_types.set(key, schema)
        this.derived_types.set(n_key, n_schema)
        // Second add the fields. This handles recursive types.
        this.fill_object_fields(type.fields, fields)
      }
      else if (type.base_type === 'array') {
        const child = null
        const schema = Array_Schema.from_string_params(
          type.alias, mixin, type.min, type.max, child)
        const n_schema = schema.clone_as_nullable()
        // First add the types to derived_types
        this.derived_types.set(key, schema)
        this.derived_types.set(n_key, n_schema)
        // Second add the child. This handles recursive types.
        const child_schema = this.build_array_child(type)
        schema.set_child_schema(child_schema)
        n_schema.child_schema = child_schema
      }
      else if (type.ref) {
        const parent = this.map_raw_type(type)
        const schema = parent.clone(type.alias, mixin ?? parent.mixin)
        const n_schema = schema.clone_as_nullable()
        this.derived_types.set(key, schema)
        this.derived_types.set(n_key, n_schema)
      }
      else {
        const schema = this.map_raw_type(type)
        const n_schema = schema.clone_as_nullable()
        this.derived_types.set(key, schema)
        this.derived_types.set(n_key, n_schema)
      }

      this.schema_stack.pop()
    }
    catch (err) {
      if (!err.path) err.path = this.schema_stack.join('')
      throw err
    }
  }

  /**
   * @param {Object<string, Raw_Schema>} raw_schemas_by_name
   * @returns {undefined}
   */
  add_derived_types(raw_schemas_by_name) {
    assert.object(raw_schemas_by_name)
    for (const [key, raw_schema] of Object.entries(raw_schemas_by_name)) {
      this.add_derived_type(key, raw_schema)
    }
  }

  /**
   * @param {Raw_Schema} raw_schema
   * @returns {Base_Schema}
   */
  get_serializer(raw_schema) {
    return this.parse_schema(raw_schema)
  }

  /**
   * @param {Raw_Schema} raw_schema
   * @param {*} body
   * @returns {string}
   */
  serialize(raw_schema, body) {
    return this.get_serializer(raw_schema).serialize(body)
  }

  /**
   * @param {Raw_Schema} raw_schema
   * @returns {Bobson_Parser}
   */
  get_parser(raw_schema) {
    const parsed_schema = this.parse_schema(raw_schema)
    return new Bobson_Parser(parsed_schema)
  }

  /**
   * @param {Raw_Schema} raw_schema
   * @param {string} string
   * @returns {*}
   */
  parse(raw_schema, string) {
    const parser = this.get_parser(raw_schema)
    return parser.parse(string)
  }

  /**
   * @param {Raw_Schema} raw_schema
   * @param {Array<Array<string>>} flat_pairs
   * @returns {*}
   */
  parse_flat_pairs(raw_schema, flat_pairs) {
    assert.array(flat_pairs)
    const obj_schema = this.parse_schema(raw_schema)
    const parser = new Flat_Pairs_Parser(obj_schema)
    return parser.parse(flat_pairs)
  }

  /**
   * @param {Raw_Type} type
   * @returns {Base_Schema}
   */
  map_raw_type(type) {
    assert.object(type)
    const mixin = this.find_mixin(type)
    if (type.ref) {
      const parent = this.derived_types.get(type.type)
      if (!parent) throw new Unknown_Schema_Error(type.type)
      return parent
    }
    else if (type.base_type === 'object') {
      const fields = new Map()
      // NOTE that there are no tests that cover inheritance here. Inheritance
      // is only tested in add_derived_type
      this.fill_object_fields(type.fields, fields)
      return new Object_Schema(
        type.alias, mixin, fields, type.required_fields, type.defaults)
    }
    else if (type.base_type === 'array') {
      const child = this.build_array_child(type)
      return Array_Schema.from_string_params(type.alias, mixin, type.min, type.max, child)
    }
    else {
      const factory = this.base_factories.get(type.base_type)
      if (!factory) throw new Error('not implemented, yet: ' + type.base_type)
      return factory(type, mixin)
    }
  }

  /**
   * @param {Map<string, Raw_Type>} type_fields
   * @param {Map<string, Base_Schema>} schema_fields
   * @returns {*}
   */
  fill_object_fields(type_fields, schema_fields) {
    for(const [key, val] of type_fields.entries()) {
      this.schema_stack.push(`.${val.full_name}`)
      if (val.type.derive) {
        const parent = this.derived_types.get(val.type.parent)
        if (!parent)
          throw new Unknown_Schema_Error(val.type.parent)
        assert.instance(parent, Object_Schema)
        let child = parent.get_child_schema(val.type.member)
        if (val.type.nullify && !child.is_nullable) {
          child = child.clone_as_nullable()
        }
        schema_fields.set(key, child)

      }
      else {
        schema_fields.set(key, this.map_raw_type(val.type))
      }
      this.schema_stack.pop()
    }
  }

  /**
   * @param {Raw_Type} type
   * @returns {Base_Schema}
   */
  build_array_child(type) {
    this.schema_stack.push('[')
    const child = this.map_raw_type(type.child)
    this.schema_stack.pop()
    return child
  }

  /**
   * @param {Raw_Schema} raw_schema
   * @returns {Base_Schema}
   */
  parse_schema(raw_schema) {
    try {
      this.schema_stack = []
      this.raw_schema_parser.schema_stack = []
      const type = this.raw_schema_parser.build_type(raw_schema)
      return this.map_raw_type(type)
    }
    catch (err) {
      if (!err.path) err.path = this.schema_stack.join('')
      throw err
    }
  }
}

module.exports = {
  Bobson_Builder,
}
