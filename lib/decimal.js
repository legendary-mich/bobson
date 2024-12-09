'use strict'

class Decimal {

  static split_string(string) {
    const is_negative = string[0] === '-'
    if (is_negative) string = string.slice(1)
    const sign = is_negative ? -1 : 1
    const [integer_part, fractional_part = ''] = string.split('.')
    return [sign, integer_part, fractional_part]
  }

  constructor(string) {
    this.string = string
    const [sign, integer_part, fractional_part] = Decimal.split_string(string)
    this.sign = sign
    this.integer_part = integer_part
    this.fractional_part = fractional_part
  }

  integer_greater(integer_part) {
    return (integer_part.length < this.integer_part.length) ||
      (integer_part.length === this.integer_part.length &&
       integer_part < this.integer_part)
  }

  integer_smaller(integer_part) {
    return (integer_part.length > this.integer_part.length) ||
      (integer_part.length === this.integer_part.length &&
       integer_part > this.integer_part)
  }

  decimal_greater(fractional_part) {
    return (fractional_part < this.fractional_part)
  }

  decimal_smaller(fractional_part) {
    return (fractional_part > this.fractional_part)
  }

  abs_greater(integer_part, fractional_part) {
    if (this.integer_greater(integer_part)) {
      return true
    }
    else if (this.integer_smaller(integer_part)) {
      return false
    }
    else if (this.decimal_greater(fractional_part)) {
      return true
    }
    return false
  }

  abs_smaller(integer_part, fractional_part) {
    if (this.integer_smaller(integer_part)) {
      return true
    }
    else if (this.integer_greater(integer_part)) {
      return false
    }
    else if (this.decimal_smaller(fractional_part)) {
      return true
    }
    return false
  }

  greater_than(sign, integer_part, fractional_part) {
    if (this.sign > sign) {
      return true
    }
    else if (this.sign < sign) {
      return false
    }
    if (sign < 0) {
      return this.abs_smaller(integer_part, fractional_part)
    }
    else {
      return this.abs_greater(integer_part, fractional_part)
    }
  }

  smaller_than(sign, integer_part, fractional_part) {
    if (this.sign > sign) {
      return false
    }
    else if (this.sign < sign) {
      return true
    }
    if (sign < 0) {
      return this.abs_greater(integer_part, fractional_part)
    }
    else {
      return this.abs_smaller(integer_part, fractional_part)
    }
  }
}

module.exports = {
  Decimal,
}
