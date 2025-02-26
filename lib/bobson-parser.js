'use strict'

const {
  member_name_schema,
  Base_Schema,
} = require('./schemas.js')

const {
  LITERAL,
  START_STRING,
  STRING,

  START_OBJECT,
  END_OBJECT_OR_MEMBER,
  MEMBER_NAME,
  MEMBER_COLON,
  MEMBER_VALUE,
  END_OBJECT_OR_COMMA,

  START_ARRAY,
  ARRAY_VALUE,
  END_ARRAY_OR_VALUE,
  END_ARRAY_OR_COMMA,

  END,
} = require('./constants.js')

const {
  assert,
  Parser_Error,
  General_Error,
  Internal_Error,
} = require('./errors.js')

class Bobson_Parser {

  constructor(compiled_schema) {
    assert.instance(compiled_schema, Base_Schema)

    this.schema_stack = [compiled_schema]
    this.result_stack = []
    this.state_stack = [END, this.get_schema().start_state]

    this.result = undefined

    this.literal_type = ''
    this.literal_step = 0
    this.literal_result = {
      'null': null,
    }

    this.current_string = ''
    this.char_idx = 0
    this.substring_idx = 0
    this.skip_next = false
  }

  get_schema() { return this.schema_stack.at(-1) }
  get_char() { return this.current_string[this.char_idx] }

  append_result(value) {
    this.result_stack.at(-1).append_result(value)
  }

  /**
   * @returns {*}
   */
  get_result() {
    if (this.schema_stack.length > 0) {
      const err = new General_Error('Incomplete payload. Some characters are missing at the end')
      err.path = this.get_schema_path()
      throw err
    }
    return this.result
  }

  get_schema_path() {
    return (this.schema_stack[0]?.type ?? '') +
      this.result_stack.map(result => result.get_path_chunk()).join('')
  }

  state_stack_swap_last(new_state) {
    this.state_stack.pop()
    this.state_stack.push(new_state)
  }

  // literal ===================================================================

  start_literal(literal) {
    this.state_stack.push(LITERAL)
    this.literal_type = literal
    this.literal_step = 1
    this.char_idx++
    this.literal()
  }

  literal() {
    for (; this.char_idx < this.current_string.length &&
      this.literal_step < this.literal_type.length;
      ++this.char_idx, ++this.literal_step) {
      const char = this.get_char()
      if (char !== this.literal_type[this.literal_step]) {
        const actual = this.literal_type.substring(0, this.literal_step) + char
        throw new Parser_Error(this.literal_type, 'literal', actual, this.literal_type)
      }
    }
    if (this.literal_step >= this.literal_type.length) {
      --this.char_idx
      this.result_stack.at(-1).set_result(this.literal_result[this.literal_type])
      this.popResult()
    }
  }

  // string ====================================================================

  start_string() {
    const char = this.get_char()
    if (char === 'n') {
      this.result_stack.push(this.get_schema().create_result_container())
      this.state_stack.pop()
      this.start_literal('null')
    }
    else if (char !== '"') {
      throw new Parser_Error('string', 'opening char', char, '"')
    }
    else {
      this.result_stack.push(this.get_schema().create_result_container())
      this.substring_idx = this.char_idx + 1
      this.state_stack_swap_last(STRING)
    }
  }

  end_substring(end_index) {
    this.append_result(this.current_string.substring(this.substring_idx, end_index))
  }

  string() {
    for (; this.char_idx < this.current_string.length; ++this.char_idx) {
      const char = this.get_char()
      if (this.skip_next) {
        this.skip_next = false
      }
      else if (char === '\\') {
        this.end_substring(this.char_idx)
        this.substring_idx = this.char_idx + 1
        this.skip_next = true
      }
      else if (char === '"') {
        this.end_substring(this.char_idx)
        this.popResult()
        return
      }
    }
    this.end_substring(this.char_idx)
  }

  // object ====================================================================

  start_object() {
    const char = this.get_char()
    if (char === 'n') {
      this.result_stack.push(this.get_schema().create_result_container())
      this.state_stack.pop()
      this.start_literal('null')
    }
    else if (char !== '{') {
      throw new Parser_Error('object', 'opening char', char, '{')
    }
    else {
      this.result_stack.push(this.get_schema().create_result_container())
      this.state_stack_swap_last(END_OBJECT_OR_MEMBER)
    }
  }

  end_object() {
    this.popResult()
  }

  start_member() {
    this.state_stack_swap_last(MEMBER_NAME)
    this.schema_stack.push(member_name_schema)
    this.state_stack.push(member_name_schema.start_state)
  }

  end_object_or_member() {
    switch (this.get_char()) {
    case '}': this.end_object(); break
    default:
      this.start_member()
      this.char_idx -= 1
    }
  }

  member_colon() {
    const char = this.get_char()
    switch (char) {
    case ':': {
      this.state_stack_swap_last(MEMBER_VALUE)
      this.state_stack.push(this.get_schema().start_state)
      break
    }
    default: throw new Parser_Error('object', 'member-colon', char, ':')
    }
  }

  end_object_or_comma() {
    const char = this.get_char()
    switch (char) {
    case '}': this.end_object(); break
    case ',': this.start_member(); break
    default: throw new Parser_Error('object', 'enclosing char', char, ', or }')
    }
  }

  // array -====================================================================

  start_array() {
    const char = this.get_char()
    if (char === 'n') {
      this.result_stack.push(this.get_schema().create_result_container())
      this.state_stack.pop()
      this.start_literal('null')
    }
    else if (char !== '[') {
      throw new Parser_Error('array', 'opening char', char, '[')
    }
    else {
      const schema = this.get_schema()
      this.result_stack.push(schema.create_result_container())
      this.schema_stack.push(schema.child_schema)
      this.state_stack_swap_last(END_ARRAY_OR_VALUE)
    }
  }

  end_array() {
    this.schema_stack.pop() // child_schema
    this.popResult()
  }

  start_array_value() {
    this.state_stack_swap_last(ARRAY_VALUE)
    this.state_stack.push(this.get_schema().start_state) // child_schema.start_state
  }

  end_array_or_value() {
    switch (this.get_char()) {
    case ']': this.end_array(); break
    default:
      this.start_array_value()
      this.char_idx -= 1
    }
  }

  end_array_or_comma() {
    const char = this.get_char()
    switch (char) {
    case ']': this.end_array(); break
    case ',': this.start_array_value(); break
    default: throw new Parser_Error('array', 'enclosing char', char, ', or ]')
    }
  }

  // parser ====================================================================

  popResult() {
    // For debugging, you may want to enable string constants in the
    // constants.js file.
    // console.log('popResult:', this.schema_stack, this.state_stack, this.result_stack)
    this.state_stack.pop()
    const result = this.get_schema().parse(this.result_stack.pop().result)
    const schema = this.schema_stack.pop()
    switch (this.state_stack.at(-1)) {
    case END: this.result = result; break
    case ARRAY_VALUE:
      this.append_result(result)
      this.schema_stack.push(schema) // arr.child_schema
      this.state_stack_swap_last(END_ARRAY_OR_COMMA)
      break
    case MEMBER_NAME: {
      const child_schema = this.get_schema().get_child_schema(result)
      this.schema_stack.push(child_schema)
      this.append_result(result)
      this.state_stack_swap_last(MEMBER_COLON)
      break
    }
    case MEMBER_VALUE: {
      this.append_result(result)
      this.state_stack_swap_last(END_OBJECT_OR_COMMA)
      break
    }
    }
  }

  /**
   * @param {string} string
   * @returns {undefined}
   */
  parse_chunk(string) {
    assert.string(string)
    try {
      this.current_string = string
      this.char_idx = 0
      this.substring_idx = 0
      for (; this.char_idx < string.length; ++this.char_idx) {
        switch (this.state_stack.at(-1)) {
        case LITERAL: this.literal(); break
        case START_STRING: this.start_string(); break
        case STRING: this.string(); break

        case START_OBJECT: this.start_object(); break
        case END_OBJECT_OR_MEMBER: this.end_object_or_member(); break
        case MEMBER_COLON: this.member_colon(); break
        case END_OBJECT_OR_COMMA: this.end_object_or_comma(); break

        case START_ARRAY: this.start_array(); break
        case END_ARRAY_OR_VALUE: this.end_array_or_value(); break
        case END_ARRAY_OR_COMMA: this.end_array_or_comma(); break

        case END: throw new General_Error('Parser has already finished. There are redundant characters after the enclosing char')
        default: throw new Internal_Error('Empty state_stack')
        }
      }
    }
    catch (err) {
      err.path = this.get_schema_path()
      throw err
    }
  }

  /**
   * @param {string} string
   * @returns {*}
   */
  parse(string) {
    this.parse_chunk(string)
    return this.get_result()
  }
}

module.exports = {
  Bobson_Parser,
}
