'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_derived_types({
  'custom_obj': {
    '+ id': 'int_js 0 100',
    '+ name': 'string 1 3',
  },
})

function run_valid(t) {
  it(t[3], () => {
    const result = bobson.parse_query_string(t[0], t[1])
    deepEq(result, t[2])
  })
}

function run_invalid(t) {
  it(t[3], () => {
    try {
      bobson.parse_query_string(t[0], t[1])
      throw new Error('should have thrown')
    }
    catch (err) {
      console.log('err.path', err.path)
      deepEq(err.message, t[2])
    }
  })
}

describe('query string', () => {

  describe('valid', () => {
    const tests = [
      [{}, '/status', {}, 'empty'],
      [{}, '/status?', {}, 'empty ?'],
      [{}, '/status?#', {}, 'empty ?#'],
      [{"- name":"string 0 10"}, '/status', {}, 'empty optional'],
      [{"- name":"string 0 10"}, '/status?', {}, 'empty optional ?'],
      [{"+ name":"string 0 10"}, '/status?name=', {name:''}, 'name='],
      [{"+ name":"string 1 10"}, '/status?name=ryan', {name:'ryan'}, 'name=ryan'],
      [{"- name":"string 1 10"}, '/status?name=ryan', {name:'ryan'}, 'optional present'],
      [{"- name":"string 1 10"}, '/status', {}, 'optional missing'],
      [{"+ name":"string 1 10"}, '/status?name=ryan#id=2', {name:'ryan'}, '#id=2'],
      [{"+ name":"string 1 10"}, '/status?name=r%20n', {name:'r n'}, 'name=r n'],
      [{"+ name":"string 1 10"}, '/status?name=r%3Dn', {name:'r=n'}, 'name=r=n'],
      [{"+ n e":"string 1 10"}, '/status?n%20e=ryan', {"n e":'ryan'}, '"n e"=ryan'],
      [{"+ n=e":"string 1 10"}, '/status?n%3De=ryan', {"n=e":'ryan'}, '"n=e"=ryan'],
      [{"+ n=e":"string 1 10", "+ n?e":"string 1 10"},
        '/status?n%3De=r%3Dn&n%3Fe=r%3Fn', {"n=e":'r=n',"n?e":'r?n'}, 'n=e r=n n?e r?n'],

      [{"+ id":"int_4 1 3"}, '/status?id=2', {id:2}, 'id:2'],
      [{"+ id":"int_4 1 3", "+ name":"string 1 3"},
        '/status?id=2&name=ho', {id:2,name:'ho'}, 'id:2 name:ho'],
      [{"+ arr":["int_4 1 9", "1 3"]},
        '/status?arr=2,3,4', {arr:[2,3,4]}, 'arr[2,3,4]'],
      [{"+ arr":["int_4 1 9", "0 3"]},
        '/status?arr=', {arr:[]}, 'arr[]'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      [undefined, '/status?name=a', 'Unknown schema type: undefined', 'undefined schema'],
      [{"+ name":"int_4 0 2"}, undefined, 'Invalid Type. Expected: string, found: undefined', 'undefined query_string'],
      [{"+ name":"int_4 0 2"}, '/status', 'Invalid object: missing required field: name', 'missing ?'],
      [{"+ name":"int_4 0 2"}, '/status?', 'Invalid object: missing required field: name', 'empty qs'],
      [{"+ name":"int_4 0 2"}, '/status?ha', 'Missing =', 'missing ='],
      [{"+ name":"int_4 0 2"}, '/status?ha=', 'Unknown key found: ha', 'unknown memb-name'],
      [{"+ name":"int_4 0 2","+ ha": "string 1 10"}, '/status?ha=a', 'Invalid object: missing required field: name', 'mssing required memb'],

      [{"+ name":"string 2 3"}, '/status?name=r', 'Invalid string: too short', 'str too short'],
      [{"+ name":"string 2 3"}, '/status?name=rasd', 'Invalid string: too long', 'str too long'],
      [{"+ name":"enum aba"}, '/status?name=ras', 'Invalid enum: ras', 'enum unknown'],
      [{"+ name":"int_4 0 2"}, '/status?name=3', 'Invalid int_4: too big', 'int_4 too big'],
      ['custom_obj', '/status?name=bo&name=ro&id=2', 'Duplicate key found: name', 'custom_obj valid'],

      // Testing for obj_schema.reset(); A valid case is followed by an invalid one.
      // If obj_schema.reset() was not called, the second test wouldn't fail.
      // EDIT: the reset() method was removed. The tests may still be useful, though.
      ['custom_obj', '/status?name=bo&id=2', 'should have thrown', 'custom_obj valid'],
      ['custom_obj', '/status?name=ra', 'Invalid custom_obj: missing required field: id', 'custom_obj invalid'],

    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
