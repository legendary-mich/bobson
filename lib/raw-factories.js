'use strict'

function string_factory(...args) {
  const type = args[0]
  const nullable = type[0] === '?'
  const base_type = nullable ? type.substring(1) : type
  return {
    alias: type,
    type,
    base_type,
    nullable,
    min: args[1],
    max: args[2],
    regex: args.slice(3).join(''),
  }
}

function number_factory(...args) {
  const type = args[0]
  const nullable = type[0] === '?'
  const base_type = nullable ? type.substring(1) : type
  return {
    alias: type,
    type,
    base_type,
    nullable,
    min: args[1],
    max: args[2],
  }
}

function enum_factory(...args) {
  const type = args[0]
  const nullable = type[0] === '?'
  const base_type = nullable ? type.substring(1) : type
  return {
    alias: type,
    type,
    base_type,
    nullable,
    values: args.slice(1),
  }
}

function ref_factory(type) {
  const nullable = type[0] === '?'
  const base_type = nullable ? type.substring(1) : type
  return {
    alias: type,
    type,
    base_type,
    nullable,
    ref: true,
  }
}

module.exports = {
  string_factory,
  number_factory,
  enum_factory,
  ref_factory,
}
