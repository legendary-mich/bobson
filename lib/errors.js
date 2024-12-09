'use strict'

function is_object(actual) {
  return typeof actual === 'object' &&
    actual !== null &&
    !Array.isArray(actual)
}

function get_actual_type(entity) {
  if (entity === null) return 'null'
  if (Array.isArray(entity)) return 'array'
  if (entity?.constructor?.name) return entity.constructor.name
  return typeof entity
}

function get_expected_type(entity) {
  if (typeof entity === 'string') return entity
  return entity?.name ?? 'unknown'
}

class Type_Error extends Error {
  constructor(actual, expected) {
    const message = `Invalid Type. Expected: ${get_expected_type(expected)}, found: ${get_actual_type(actual)}`
    super(message)
    this.name = this.constructor.name
    this.path = ''
  }
}

class Duplicate_Key_Error extends Error {
  constructor(key_name) {
    super(`Duplicate key found: ${key_name}`)
    this.name = this.constructor.name
    this.path = ''
  }
}

class Unknown_Key_Error extends Error {
  constructor(key_name) {
    super(`Unknown key found: ${key_name}`)
    this.name = this.constructor.name
    this.path = ''
  }
}

class Duplicate_Schema_Error extends Error {
  constructor(schema_name) {
    super(`Duplicate schema type: ${schema_name}`)
    this.name = this.constructor.name
    this.path = ''
  }
}

class Unknown_Schema_Error extends Error {
  constructor(schema_name) {
    const actual = typeof schema_name === 'string' ?
      schema_name : get_actual_type(schema_name)
    super(`Unknown schema type: ${actual}`)
    this.name = this.constructor.name
    this.path = ''
  }
}

class Prefix_Error extends Error {
  constructor(actual, expected) {
    const suffix = actual.slice(1)
    super(`Invalid prefix. Expected: (${expected})${suffix}, found: (${actual[0]})${suffix}`)
    this.name = this.constructor.name
    this.path = ''
  }
}

class Not_Implemented_Error extends Error {
  constructor() {
    super(`Not Implemented`)
    this.name = this.constructor.name
    this.path = ''
  }
}

class Validation_Error extends Error {
  constructor(type, reason) {
    super(`Invalid ${type}: ${reason}`)
    this.name = this.constructor.name
    this.path = ''
  }
}

class Configuration_Error extends Error {
  constructor(type, param, value, reason = '') {
    value = /^\s*$/.test(value) ? undefined : value
    reason = reason === '' ? '' : `; ${reason}`
    super(`Invalid ${param} param for ${type} schema: ${value}${reason}`)
    this.name = this.constructor.name
    this.path = ''
  }
}

class General_Error extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    this.path = ''
  }
}

class Parser_Error extends Error {
  // The 'type' should be one of: object, array, string. The 'schema.type' will
  // not work for member-colons, because when parsing a member-colon, the
  // member-child schema is already on the top of the stack, and in this case
  // the expectation is to see the object schema type, and not the member schema
  // type.
  constructor(type, detail, actual, expected) {
    super(`Invalid ${type} ${detail}. Expected: ${expected}, found: ${actual}`)
    this.name = this.constructor.name
    this.path = ''
  }
}

const assert = {
  instance(value, expected_class) {
    if (!(value instanceof expected_class)) throw new Type_Error(value, expected_class)
  },
  object(value) {
    if (!is_object(value)) throw new Type_Error(value, 'object')
  },
  function(value) {
    if (typeof value !== 'function') throw new Type_Error(value, 'function')
  },
  array(value) {
    if (!Array.isArray(value)) throw new Type_Error(value, 'array')
  },
  null(value) {
    if (value !== null) throw new Type_Error(value, 'null')
  },
  string(value) {
    if (typeof value !== 'string') throw new Type_Error(value, 'string')
  },
  boolean(value) {
    if (typeof value !== 'boolean') throw new Type_Error(value, 'boolean')
  },
  number(value) {
    if (typeof value !== 'number') throw new Type_Error(value, 'number')
  },
  bigint(value) {
    if (typeof value !== 'bigint') throw new Type_Error(value, 'bigint')
  },
}

module.exports = {
  assert,
  is_object,
  Type_Error,
  Duplicate_Key_Error,
  Unknown_Key_Error,
  Duplicate_Schema_Error,
  Unknown_Schema_Error,
  Prefix_Error,
  Not_Implemented_Error,
  Validation_Error,
  Configuration_Error,
  Parser_Error,
  General_Error,
}
