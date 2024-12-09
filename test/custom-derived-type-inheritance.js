'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const builder = new Bobson_Builder()
builder.add_derived_types({
  "user": {
    "+ id": "int_4 0 max",
    "- name": "string 1 10",
    "- date": "?string 10 10 \\d{4}-\\d{2}-\\d{2}",
    "- height": "int_4 0 230",
    "- sp ace": "string 0 20",
  },
  "employee": {
    "+ id": "int_8 0 max",
    "+ job": "string 0 20",
    "< user": [
      "+ name",
      "+ date",
      "- height",
      "- sp ace",
    ],
  },
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
      deepEq(err.message, t[2])
    }
  })
}

describe('custom derived type inheritance', () => {
  describe('valid', () => {
    const tests = [
      ['employee', '{"id":"2","job":"cook","name":"bob","date":"2022-02-03"}',
        {id:2n,job:'cook',name:'bob','date':'2022-02-03'}, 'without required'],
      ['employee', '{"id":"2","job":"cook","name":"bob","date":"2022-02-03","height":"180"}',
        {id:2n,job:'cook',name:'bob','date':'2022-02-03',"height":180}, 'with required'],
      ['employee', '{"id":"2","job":"cook","name":"bob","date":null}',
        {id:2n,job:'cook',name:'bob','date':null}, 'nullable date'],
      ['employee', '{"id":"2","job":"cook","name":"bob","date":"2022-02-03","sp ace":""}',
        {id:2n,job:'cook',name:'bob','date':'2022-02-03','sp ace':''}, 'fieldname with a space'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?valid', () => {
    const tests = [
      ['?employee', '{"id":"2","job":"cook","name":"bob","date":"2022-02-03"}',
        {id:2n,job:'cook',name:'bob','date':'2022-02-03'}, 'without required'],
      ['?employee', 'null', null, 'nullable null'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      ['employee', 'null', 'Invalid employee: null', 'non-nullable null'],
      ['employee', '{"job":"cook","name":"bob","date":"2022-02-03","height":"180"}', 'Invalid employee: missing required field: id', 'Missing id'],
      ['employee', '{"id":"2","name":"bob","date":"2022-02-03","height":"180"}', 'Invalid employee: missing required field: job', 'Missing job'],
      ['employee', '{"id":"2","job":"cook","date":"2022-02-03","height":"180"}', 'Invalid employee: missing required field: name', 'Missing name'],
      ['employee', '{"id":"2","job":"cook","name":"bob","height":"180"}', 'Invalid employee: missing required field: date', 'Missing date'],
      ['employee', '{"id":"2","job":"cook","name":"bob","date":"2022-02-03","size":"180"}', 'Unknown key found: size', 'Additional field size'],
      ['employee', '{"id":"s","job":"cook","name":"bob","date":"2022-02-03","height":"180"}', 'Invalid int_8: does not match regex', 'Invalid id'],
      ['employee', '{"id":"2","job":"cook","name":"bob","date":"22-02-03","height":"180"}', 'Invalid ?string: too short', 'Invalid date'],
      ['employee', '{"id":"2","job":"cook","name":"bob","date":"2022-02-03","height":"aa"}', 'Invalid int_4: does not match regex', 'Invalid height'],
      ['employee', '{"id":"2","job":"cook","name":null,"date":"2022-02-03","height":"180"}', 'Invalid string: null', 'name null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?invalid', () => {
    const tests = [
      ['?employee', '{"job":"cook","name":"bob","date":"2022-02-03","height":"180"}', 'Invalid ?employee: missing required field: id', 'Missing id'],
      ['?employee', '{"id":"2","name":"bob","date":"2022-02-03","height":"180"}', 'Invalid ?employee: missing required field: job', 'Missing job'],
      ['?employee', '{"id":"2","job":"cook","date":"2022-02-03","height":"180"}', 'Invalid ?employee: missing required field: name', 'Missing name'],
      ['?employee', '{"id":"2","job":"cook","name":"bob","height":"180"}', 'Invalid ?employee: missing required field: date', 'Missing date'],
      ['?employee', '{"id":"2","job":"cook","name":"bob","date":"2022-02-03","size":"180"}', 'Unknown key found: size', 'Additional field size'],
      ['?employee', '{"id":"s","job":"cook","name":"bob","date":"2022-02-03","height":"180"}', 'Invalid int_8: does not match regex', 'Invalid id'],
      ['?employee', '{"id":"2","job":"cook","name":"bob","date":"22-02-03","height":"180"}', 'Invalid ?string: too short', 'Invalid date'],
      ['?employee', '{"id":"2","job":"cook","name":"bob","date":"2022-02-03","height":"aa"}', 'Invalid int_4: does not match regex', 'Invalid height'],
      ['?employee', '{"id":"2","job":"cook","name":null,"date":"2022-02-03","height":"180"}', 'Invalid string: null', 'name null'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
