'use strict'
const {Bobson_Builder} = require('../lib/index.js')
const sjson = require('secure-json-parse')
const Ajv = require('ajv')
const ajv = new Ajv({coerceTypes:true})

function build_benchmark_cases(bobson_schema, ajv_schema, payload) {
  const bobson = new Bobson_Builder()
  ajv.addSchema(ajv_schema, 'schema')
  bobson.add_derived_types({
    schema: bobson_schema,
  })

  const bobson_case = () => {
    const parser = bobson.get_parser('schema')
    parser.parse(payload)
  }

  const json_case = () => {
    const parsed = JSON.parse(payload)
    const ajv_validate = ajv.getSchema('schema')
    const valid = ajv_validate(parsed)
    if (!valid) throw ajv_validate.errors
  }

  const secure_case = () => {
    const parsed = sjson.parse(payload)
    const ajv_validate = ajv.getSchema('schema')
    const valid = ajv_validate(parsed)
    if (!valid) throw ajv_validate.errors
  }

  const test_cases = [
    ['bobson', bobson_case],
    ['json  ', json_case],
    ['secure', secure_case],
  ]

  return test_cases

}

module.exports = {
  build_benchmark_cases,
}
