'use strict'

const {Benchmark_Runner} = require('./runner.js')
const {build_benchmark_cases} = require('./case-builder.js')

const bobson_schema = ["int_4 min max", "0 20"]
const payload = '["222","98374","-298344","92344","0","-9283434","9843444"]'
const ajv_schema = {
  type: 'array',
  items: {
    type: 'integer',
    'minimum': -2147483648,
    'maximum': 2147483647,
  },
}

const params = {
  num_of_iter: 5,
  num_of_op: 100000,
}

const runner = new Benchmark_Runner(params)
const test_cases = build_benchmark_cases(bobson_schema, ajv_schema, payload)
runner.run(test_cases)
