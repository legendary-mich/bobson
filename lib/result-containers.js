'use strict'

const {Duplicate_Key_Error, assert} = require('./errors.js')

class Object_Result {
  constructor() {
    this.member_state = 0
    this.current_member = null
    this.result = {}
  }

  // If you want to remove the null assertion, make sure that you validate the
  // result the same way it is validated in the append_result method.
  set_result(val) { assert.null(val); this.result = val }

  append_result(val) {
    if (this.member_state === 0) {
      this.current_member = val
      if (Object.hasOwn(this.result, val)) {
        throw new Duplicate_Key_Error(val)
      }
    }
    else {
      this.result[this.current_member] = val
    }
    this.member_state = (this.member_state + 1) % 2
  }

  get_path_chunk() {
    return this.current_member ? '.' + this.current_member : ''
  }
}

class Array_Result {
  constructor(schema) {
    this.schema = schema
    this.result = []
  }

  // If you want to remove the null assertion, make sure that you validate the
  // result the same way it is validated in the append_result method.
  set_result(val) { assert.null(val); this.result = val }

  append_result(val) {
    this.schema.validate_max_length(this.result.length + 1)
    this.result.push(val)
  }

  get_path_chunk() {
    return `[${this.result?.length ?? null}]`
  }
}

class String_Result {
  constructor(schema) {
    this.schema = schema
    this.result = ''
  }

  // If you want to remove the null assertion, make sure that you validate the
  // result the same way it is validated in the append_result method.
  set_result(val) { assert.null(val); this.result = val }

  append_result(val) {
    this.schema.validate_max_length(val.length + this.result.length)
    this.result += val
  }

  get_path_chunk() { return '' }
}

module.exports = {
  Object_Result,
  Array_Result,
  String_Result,
}
