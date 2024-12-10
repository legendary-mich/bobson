'use strict'

const {Benchmark_Runner} = require('./runner.js')
const {build_benchmark_cases} = require('./case-builder.js')

const bobson_schema = ["string 0 20", "0 20"]
const payload = '["haha","lolo","bobobo","nananan","kokjoidf","lksjdfkj","lksjdfss"]'
const ajv_schema = {
  type: 'array',
  items: {
    type: 'string',
    'minLength': 0,
    'maxLength': 20,
  },
}

const params = {
  num_of_iter: 5,
  num_of_op: 100000,
}

const runner = new Benchmark_Runner(params)
const test_cases = build_benchmark_cases(bobson_schema, ajv_schema, payload)
runner.run(test_cases)
