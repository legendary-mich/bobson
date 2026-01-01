'use strict'

const {
  assert,
  Duplicate_Key_Error,
  Duplicate_Schema_Error,
  Unknown_Schema_Error,
  Prefix_Error,
} = require('./errors.js')
const {Uniform_Map} = require('./uniform-map.js')
const {ref_factory} = require('./raw-factories.js')

class Raw_Schema_Parser {
  constructor() {
    this.base_factories = new Uniform_Map()
    this.derived_types = new Map()
    this.schema_stack = []
  }

  add_base_type(key, factory_fn) {
    assert.string(key)
    assert.function(factory_fn)
    this.base_factories.set(key, factory_fn)
  }

  _build_type(raw_schema) {
    if (!Array.isArray(raw_schema)) {
      throw new Unknown_Schema_Error(raw_schema)
    }
    if (raw_schema.length < 1) {
      throw new Unknown_Schema_Error()
    }

    const full_type = raw_schema[0]
    const nullable = full_type[0] === '?'
    let result = null
    const base_factory = this.base_factories.get(full_type)
    if (base_factory) {
      result = base_factory(...raw_schema)
    }
    else if (/^\??array/.test(full_type)) {
      this.schema_stack.push('[')
      const child = this.build_type(raw_schema[1])
      this.schema_stack.pop()
      const arr_parts = full_type.split(' ')
      const [min, max, rest] = arr_parts.slice(1)
      if (rest !== undefined) throw new Unknown_Schema_Error(full_type)
      result = {
        alias: arr_parts[0],
        type: arr_parts[0], // array or ?array
        base_type: 'array',
        nullable,
        min,
        max,
        child,
      }
    }
    else if (/^\??object$/.test(full_type)) {
      const fields = new Map()
      const required_fields = []
      const get_field_name = (key) => {
        if (!/^[+-]$/.test(key[0]))
          throw new Prefix_Error(key, '+/-')
        const field_name = key.slice(2)
        if (fields.has(field_name))
          throw new Duplicate_Key_Error(field_name)
        return field_name
      }
      const add_field = (name, full_name, type) => {
        if (name[0] === '?') {
          throw new Prefix_Error(name, 'not ?')
        }
        const member = {
          name,
          full_name,
          required: full_name[0] === '+',
          type,
        }
        fields.set(name, member)
        if (member.required) {
          required_fields.push(member.name)
        }
      }
      assert.object(raw_schema[1])
      for (const [f, schema] of Object.entries(raw_schema[1])) {
        this.schema_stack.push('.' + f)
        if (f[0] === '<') {
          assert.array(schema)
          const parent = f.substring(2)
          let previous = null
          const add_derived = (current) => {
            if (previous !== null && previous[0] !== '=') {
              const field_name = get_field_name(previous)
              const schema_name = current?.[0] === '=' ? current.slice(2) : field_name
              const nullify = schema_name[0] === '?'
              add_field(field_name, previous, {
                derive: true,
                parent,
                member: nullify ? schema_name.substring(1) : schema_name,
                nullify,
              })
            }
            else if (current?.[0] === '=') {
              throw new Prefix_Error(current, '+/-')
            }
            previous = current
          }
          for (const current of schema) {
            add_derived(current)
          }
          add_derived(null)
        }
        else {
          const field_name = get_field_name(f)
          add_field(field_name, f, this.build_type(schema))
        }
        this.schema_stack.pop()
      }
      result = {
        alias: full_type,
        type: full_type, // object or ?object
        base_type: 'object',
        fields,
        required_fields,
        nullable,
        defaults: raw_schema[2] ?? {},
      }
    }
    return result
  }

  build_type(raw_schema) {
    let result = null
    if (typeof raw_schema === 'string') {
      result = this._build_type(raw_schema.split(' ')) ??
        ref_factory(raw_schema)
    }
    else if (Array.isArray(raw_schema)) {
      result = this._build_type(raw_schema)
      if (!result) {
        throw new Unknown_Schema_Error(raw_schema[0])
      }
    }
    else {
      throw new Unknown_Schema_Error(raw_schema)
    }
    return result
  }

  add_derived_type(key, raw_schema) {
    assert.string(key)
    if (key[0] === '?')
      throw new Prefix_Error(key[0], 'not ?')
    if (this.base_factories.has(key) || this.derived_types.has(key))
      throw new Duplicate_Schema_Error(key)

    try {
      this.schema_stack = []
      this.schema_stack.push(key)
      const type = this.build_type(raw_schema)
      type.alias = key
      this.derived_types.set(key, type)
      this.schema_stack.pop()
      return type
    }
    catch (err) {
      err.path = this.schema_stack.join('')
      throw err
    }
  }
}

module.exports = {
  Raw_Schema_Parser,
}
