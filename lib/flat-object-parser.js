'use strict'

const {
  member_name_schema,
  Base_Schema,
} = require('./schemas.js')

const {START_ARRAY} = require('./constants.js')

const {
  assert,
} = require('./errors.js')

class Flat_Object_Parser {

  constructor(compiled_schema) {
    assert.instance(compiled_schema, Base_Schema)
    this.schema = compiled_schema
  }

  parse(pairs) {
    const obj_schema = this.schema
    const obj_result = obj_schema.create_result_container()
    const result_stack = [obj_result]
    try {
      for (const [name, value] of pairs) {
        const member_schema = obj_schema.get_child_schema(name)
        const member_result = member_schema.create_result_container()
        result_stack.push(member_result)
        obj_result.append_result(member_name_schema.parse(name))
        if (member_schema.start_state === START_ARRAY) {
          const arr_value_schema = member_schema.child_schema
          const arr_values = value ? value.split(',') : []
          for (const v of arr_values) {
            const arr_value_result = arr_value_schema.create_result_container()
            result_stack.push(arr_value_result)
            arr_value_result.append_result(v)
            member_result.append_result(arr_value_schema.parse(arr_value_result.result))
            result_stack.pop()
          }
        }
        else {
          member_result.append_result(value)
        }
        obj_result.append_result(member_schema.parse(member_result.result))
        result_stack.pop()
      }
      return obj_schema.parse(obj_result.result)
    }
    catch (err) {
      err.path = (obj_schema?.type ?? '') +
        result_stack.map(result => result.get_path_chunk()).join('')
      throw err
    }
  }

}

module.exports = {
  Flat_Object_Parser,
}
