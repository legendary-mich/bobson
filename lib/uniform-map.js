'use strict'

const {
  assert,
  Prefix_Error,
} = require('./errors.js')

class Uniform_Map {
  constructor() {
    this.map = new Map()
  }

  get_stripped_key(key) {
    return key[0] === '?' ? key.slice(1): key
  }

  has(key) {
    if (typeof key !== 'string') return false
    return this.map.has(this.get_stripped_key(key))
  }

  get(key) {
    if (typeof key !== 'string') return
    return this.map.get(this.get_stripped_key(key))
  }

  set(key, value) {
    assert.string(key)
    if (key[0] === '?')
      throw new Prefix_Error(key[0], 'not ?')
    this.map.set(key, value)
  }
}

module.exports = {
  Uniform_Map,
}
