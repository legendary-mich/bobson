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
    const result = bobson.parse_flat_pairs(t[0], t[1])
    deepEq(result, t[2])
  })
}

function run_invalid(t) {
  it(t[3], () => {
    try {
      bobson.parse_flat_pairs(t[0], t[1])
      throw new Error('should have thrown')
    }
    catch (err) {
      console.log('err.path', err.path)
      deepEq(err.message, t[2])
    }
  })
}

describe('flat pairs parser', () => {

  describe('valid', () => {
    const tests = [
      [{}, [], {}, 'empty'],
      [{"+ name":"string 0 10"}, [['name', '']], {name:''}, 'name empty'],
      [{"+ name":"string 1 10"}, [['name', 'ryan']], {name:'ryan'}, 'name=ryan'],
      [{"- name":"string 1 10"}, [['name', 'ryan']], {name:'ryan'}, 'optional present'],
      [{"- name":"string 1 10"}, [], {}, 'optional missing'],
      [{"+ name":"string 1 10"}, [['name', 'r n']], {name:'r n'}, 'name=r n'],
      [{"+ n e":"string 1 10"}, [['n e', 'ryan']], {"n e":'ryan'}, '"n e"=ryan'],
      [{"+ n=e":"string 1 10", "+ n?e":"string 1 10"},
        [['n=e', 'r=n'], ['n?e', 'r?n']], {"n=e":'r=n',"n?e":'r?n'}, 'n=e r=n n?e r?n'],

      [{"+ id":"int_4 1 3"}, [['id', '2']], {id:2}, 'id:2'],
      [{"+ id":"int_4 1 3", "+ name":"string 1 3"},
        [['id', '2'], ['name', 'ho']], {id:2,name:'ho'}, 'id:2 name:ho'],
      [{"+ arr":["array 1 3", "int_4 1 9"]},
        [['arr', '2,3,4']], {arr:[2,3,4]}, 'arr[2,3,4]'],
      [{"+ arr":["array 0 3", "int_4 1 9"]},
        [['arr', '']], {arr:[]}, 'arr[]'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      [undefined, [['name', 'a']], 'Unknown schema type: undefined', 'undefined schema'],
      [{"+ name":"int_4 0 2"}, undefined, 'Invalid Type. Expected: array, found: undefined', 'undefined array'],
      [{"+ name":"int_4 0 2"}, [], 'Invalid object: missing required field: name', 'missing required'],
      [{"+ name":"int_4 0 2"}, [[]], 'Unknown key found: undefined', 'missing key'],
      [{"+ name":"int_4 0 2"}, [['name']], 'Invalid Type. Expected: string, found: undefined', 'missing value'],
      [{"+ name":"int_4 0 2"}, [['name', {}]], 'Invalid Type. Expected: string, found: Object', 'invalid value type'],
      [{"+ name":"int_4 0 2"}, [['name', '']], 'Invalid int_4: does not match regex', 'empty value'],
      [{"+ name":"int_4 0 2"}, [['ha', 'na']], 'Unknown key found: ha', 'unknown memb-name'],
      [{"+ name":"int_4 0 2","+ ha": "string 1 10"}, [['ha', 'a']], 'Invalid object: missing required field: name', 'mssing required memb'],

      [{"+ name":"string 2 3"}, [['name', 'r']], 'Invalid string: too short', 'str too short'],
      [{"+ name":"string 2 3"}, [['name', 'rasd']], 'Invalid string: too long', 'str too long'],
      [{"+ name":"enum aba"}, [['name', 'ras']], 'Invalid enum: ras', 'enum unknown'],
      [{"+ name":"int_4 0 2"}, [['name', '3']], 'Invalid int_4: too big', 'int_4 too big'],
      ['custom_obj', [['name', 'bo'],['name', 'ro'], ['id', '2']], 'Duplicate key found: name', 'duplicate key'],

      // Testing for obj_schema.reset(); A valid case is followed by an invalid one.
      // If obj_schema.reset() was not called, the second test wouldn't fail.
      // EDIT: the reset() method was removed. The tests may still be useful, though.
      ['custom_obj', [['name', 'bo'],['id', '2']], 'should have thrown', 'custom_obj valid'],
      ['custom_obj', [['name', 'ra']], 'Invalid custom_obj: missing required field: id', 'custom_obj invalid'],

    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })
})
