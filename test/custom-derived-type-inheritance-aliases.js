'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const builder = new Bobson_Builder()
builder.add_derived_types({
  "user": ["object", {
    "+ id": "int_8 1 max",
    "+ name": "?string 1 10",
    "+ height": "int_4 0 230",
  }],
  "email": ["object", {
    "+ id": "int_4 1 max",
    "+ address": "string 1 10",
    "+ something": "string 1 10",
  }],
  "user_email": ["object", {
    "< user": [
      "+ user_id", "= id",
      "- uname", "= name",
      "- bname", "= name",
      "+ height",
    ],
    "< email": [
      "+ address",
      "- sth", "= something",
      "+ email_id", "= id",
    ],
  }],
})

function run_valid(t) {
  it(t[3], () => {
    const p = builder.get_parser(t[0])
    const result = p.parse(t[1])
    deepEq(result, t[2])
  })
}

function run_invalid(t) {
  it(t[3], () => {
    try {
      const p = builder.get_parser(t[0])
      p.parse(t[1])
      throw new Error('should have thrown')
    }
    catch (err) {
      // console.log('err path:', err.path)
      deepEq(err.message, t[2])
    }
  })
}

describe('custom derived type inheritance aliases', () => {
  describe('valid', () => {
    const tests = [
      ['user_email', '{"user_id":"2","email_id":"3","height":"180","address":"street"}',
        {user_id:2n,email_id:3,height:180,'address':'street'}, 'without optional'],
      ['user_email', '{"user_id":"2","email_id":"3","height":"180","address":"street","uname":"bob","bname":"dot","sth":"lol"}',
        {user_id:2n,email_id:3,height:180,'address':'street',uname:'bob',bname:'dot',sth:'lol'}, 'with optional'],
      ['user_email', '{"user_id":"2","email_id":"3","height":"180","address":"street","uname":"bob","sth":"lol"}',
        {user_id:2n,email_id:3,height:180,'address':'street',uname:'bob',sth:'lol'}, 'with optional'],
      ['user_email', '{"user_id":"2","email_id":"3","height":"180","address":"street","uname":null,"sth":"lol"}',
        {user_id:2n,email_id:3,height:180,'address':'street',uname:null,sth:'lol'}, 'with null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?valid', () => {
    const tests = [
      ['?user_email', '{"user_id":"2","email_id":"3","height":"180","address":"street"}',
        {user_id:2n,email_id:3,height:180,'address':'street'}, 'without optional'],
      ['?user_email', 'null', null, 'nullable null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      ['user_email', 'null', 'Invalid user_email: null', 'non-nullable null'],
      ['user_email', '{"email_id":"3","height":"180","address":"street","uname":"bob","sth":"lol"}',
        'Invalid user_email: missing required field: user_id', 'missing required user_id'],
      ['user_email', '{"user_id":"22","height":"180","address":"street","uname":"bob","sth":"lol"}',
        'Invalid user_email: missing required field: email_id', 'missing required email_id'],
      ['user_email', '{"user_id":"22","email_id":"3","address":"street","uname":"bob","sth":"lol"}',
        'Invalid user_email: missing required field: height', 'missing required height'],
      ['user_email', '{"user_id":"22","email_id":"3","height":"180","address":"street","name":"bob","uname":"bob","sth":"lol"}',
        'Unknown key found: name', 'Additional key: name'],
      ['user_email', '{"user_id":"22","email_id":"zo","height":"180","address":"street","uname":"bob","sth":"lol"}',
        'Invalid int_4: does not match regex', 'invalid id'],
      ['user_email', '{"user_id":"22","email_id":"33","height":"180","address":"street","uname":"","bname":"b","sth":"lol"}',
        'Invalid ?string: too short', 'invalid uname'],
      ['user_email', '{"user_id":"22","email_id":"33","height":"180","address":"street","uname":"u","bname":"","sth":"lol"}',
        'Invalid ?string: too short', 'invalid bname'],
      ['user_email', '{"user_id":"22","email_id":"3","height":"180","address":"street","uname":"bob","sth":null}',
        'Invalid string: null', 'invalid string: null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?invalid', () => {
    const tests = [
      ['?user_email', '{"email_id":"3","height":"180","address":"street","uname":"bob","sth":"lol"}',
        'Invalid ?user_email: missing required field: user_id', 'missing required user_id'],
      ['?user_email', '{"user_id":"22","height":"180","address":"street","uname":"bob","sth":"lol"}',
        'Invalid ?user_email: missing required field: email_id', 'missing required email_id'],
      ['?user_email', '{"user_id":"22","email_id":"3","address":"street","uname":"bob","sth":"lol"}',
        'Invalid ?user_email: missing required field: height', 'missing required height'],
      ['?user_email', '{"user_id":"22","email_id":"3","height":"180","address":"street","name":"bob","uname":"bob","sth":"lol"}',
        'Unknown key found: name', 'Additional key: name'],
      ['?user_email', '{"user_id":"22","email_id":"zo","height":"180","address":"street","uname":"bob","sth":"lol"}',
        'Invalid int_4: does not match regex', 'invalid id'],
      ['?user_email', '{"user_id":"22","email_id":"3","height":"180","address":"street","uname":"bob","sth":null}',
        'Invalid string: null', 'invalid string: null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
