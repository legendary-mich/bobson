'use strict'

const {Benchmark_Runner} = require('./runner.js')
const {build_benchmark_cases} = require('./case-builder.js')

const bobson_schema = {
  "+ bob": "string 0 20",
  "+ lob": "string 0 20",
  "+ chop": "string 0 20",
  "+ dop": "string 0 20",
}
const payload = '{"bob":"hahaha","lob":"","chop":"lksdjflkjdf","dop":"lksjdfsdf"}'
const ajv_schema = {
  type: 'object',
  properties: {
    bob: {
      type: 'string',
      'minLength': 0,
      'maxLength': 20,
    },
    lob: {
      type: 'string',
      'minLength': 0,
      'maxLength': 20,
    },
    chop: {
      type: 'string',
      'minLength': 0,
      'maxLength': 20,
    },
    dop: {
      type: 'string',
      'minLength': 0,
      'maxLength': 20,
    },
  },
  required: ['bob'],
  additionalProperties: false,
}

const params = {
  num_of_iter: 5,
  num_of_op: 100000,
}

const runner = new Benchmark_Runner(params)
const test_cases = build_benchmark_cases(bobson_schema, ajv_schema, payload)
runner.run(test_cases)
