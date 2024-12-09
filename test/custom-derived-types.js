'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')

function run_valid(t) {
  it(t[4], () => {
    const builder = new Bobson_Builder()
    builder.add_derived_types(t[1])
    const p = builder.get_parser(t[0])
    const result = p.parse(t[2])
    deepEq(result, t[3])
  })
}

function run_invalid(t) {
  it(t[4], () => {
    try {
      const builder = new Bobson_Builder()
      builder.add_derived_types(t[1])
      const p = builder.get_parser(t[0])
      p.parse(t[2])
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq(err.message, t[3])
    }
  })
}

describe('custom derived types', () => {
  describe('valid', () => {
    const tests = [
      ['color', {'color':'enum red'}, '"red"', 'red', 'color red'],
      ['name', {'name':'string 0 2'}, '"bo"', 'bo', 'name bo'],
      ['user', {'user':{'+ name':'string 0 2'}}, '{"name":"bo"}', {name:"bo"}, 'user bo'],
      ['elems', {'elems':['string 0 2', '0 2']}, '["el"]', ['el'], 'elems el'],

      [{'+ bob':'user'}, {'user':{'+ name':'string 0 2'}},
        '{"bob":{"name":"bo"}}', {bob:{name:"bo"}}, 'bob user bo'],
      [['elems', '0 1'], {'elems':['string 0 2', '0 2']},
        '[["el"]]', [['el']], '[elems el]'],

      [{'+ bob':'user','+ ola':'user'}, {'user':{'+ name':'string 0 2'}},
        '{"bob":{"name":"bo"},"ola":{"name":"ha"}}',
        {bob:{name:"bo"},ola:{name:"ha"}}, 'bob,ola user'],
      [['elems', '0 2'], {'elems':['string 0 2', '0 2']},
        '[["el"],["ol"]]', [['el'],['ol']], '[elems el ol]'],

      ['tree', {'tree':{'- leaf':'tree'}}, '{"leaf":{}}', {leaf:{}}, 'obj tree'],
      ['tree', {'tree':{'+ sth':{'- leaf':'tree'}}}, '{"sth":{"leaf":{"sth":{}}}}', {sth:{leaf:{sth:{}}}}, 'obj tree 2x sth'],
      ['tree', {'tree':{'+ sth':{'- leaf':'tree'}}}, '{"sth":{"leaf":{"sth":{"leaf":{"sth":{}}}}}}', {sth:{leaf:{sth:{leaf:{sth:{}}}}}}, 'obj tree 3x sth'],

      ['tree', {'tree':{'- a':'string 0 1','- leaf':'tree','- b':'string 0 1'}}, '{"leaf":{"a":"x","leaf":{},"b":"y"}}', {leaf:{a:'x',b:'y',leaf:{}}}, 'obj mixed fields'],

      ['tree', {'tree':['tree','0 3']}, '[]', [], 'arr tree lvl 0'],
      ['tree', {'tree':['tree','0 3']}, '[[],[]]', [[],[]], 'arr tree lvl 1'],
      ['tree', {'tree':['tree','0 3']}, '[[[],[]],[]]', [[[],[]],[]], 'arr tree lvl 2'],

      ['tree', {'tree':{'+ sth':['tree','0 3']}}, '{"sth":[]}', {sth:[]}, 'obj-arr tree lvl 0'],
      ['tree', {'tree':{'+ sth':['tree','0 3']}}, '{"sth":[{"sth":[]}]}', {sth:[{sth:[]}]}, 'obj-arr tree lvl 1'],
      ['tree', {'tree':{'+ sth':['tree','0 3']}}, '{"sth":[{"sth":[{"sth":[]},{"sth":[]}]}]}', {sth:[{sth:[{sth:[]},{sth:[]}]}]}, 'obj-arr tree lvl 2'],

      ['tree', {'tree':[{'+ sth':'tree'},'0 3']}, '[]', [], 'arr-obj tree lvl 0'],
      ['tree', {'tree':[{'+ sth':'tree'},'0 3']}, '[{"sth":[]}]', [{sth:[]}], 'arr-obj tree lvl 1'],
      ['tree', {'tree':[{'+ sth':'tree'},'0 3']}, '[{"sth":[{"sth":[]},{"sth":[]}]}]', [{sth:[{sth:[]},{sth:[]}]}], 'arr-obj tree lvl 2'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?valid', () => {
    const tests = [
      ['?color', {'color':'enum red'}, '"red"', 'red', 'color red'],
      ['?color', {'color':'enum red'}, 'null', null, 'color null'],
      ['?name', {'name':'string 0 2'}, '"bo"', 'bo', 'name bo'],
      ['?name', {'name':'string 0 2'}, 'null', null, 'name null'],
      ['?user', {'user':{'+ name':'string 0 2'}}, '{"name":"bo"}', {name:"bo"}, 'user bo'],
      ['?user', {'user':{'+ name':'string 0 2'}}, 'null', null, 'user null'],
      ['?elems', {'elems':['string 0 2', '0 2']}, '["el"]', ['el'], 'elems el'],
      ['?elems', {'elems':['string 0 2', '0 2']}, 'null', null, 'elems null'],

      [{'+ bob':'?user'}, {'user':{'+ name':'string 0 2'}},
        '{"bob":{"name":"bo"}}', {bob:{name:"bo"}}, 'bob user bo'],
      [{'+ bob':'?user'}, {'user':{'+ name':'string 0 2'}},
        '{"bob":null}', {bob:null}, 'bob user null'],
      [['?elems', '0 1'], {'elems':['string 0 2', '0 2']},
        '[["el"]]', [['el']], '[elems el]'],
      [['?elems', '0 1'], {'elems':['string 0 2', '0 2']},
        '[null]', [null], '[elems null]'],

      ['?tree', {'tree':{'- leaf':'tree'}}, 'null', null, 'obj tree lvl 0'],
      ['tree', {'tree':{'- leaf':'?tree'}}, '{"leaf":null}', {leaf:null}, 'obj tree lvl 1'],

      ['?tree', {'tree':['tree','0 3']}, 'null', null, 'arr tree lvl 0'],
      ['tree', {'tree':['?tree','0 3']}, '[null]', [null], 'arr tree lvl 1'],

    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      ['color', {'color':'enum red'}, '"reds"', 'Invalid color: too long', 'color red'],
      ['color', {'color':'enum red'}, 'null', 'Invalid color: null', 'color null'],
      ['name', {'name':'string 0 2'}, '"bos"', 'Invalid name: too long', 'name bo'],
      ['name', {'name':'string 0 2'}, 'null', 'Invalid name: null', 'name null'],
      ['user', {'user':{'+ name':'string 0 2'}}, '{}', 'Invalid user: missing required field: name', 'user bo required'],
      ['user', {'user':{'+ name':'string 0 2'}}, '{"name":"ass"}', 'Invalid string: too long', 'user bo string too long'],
      ['user', {'user':{'+ name':'string 0 2'}}, 'null', 'Invalid user: null', 'user null'],
      ['elems', {'elems':['string 0 2', '1 2']}, '[]', 'Invalid elems: too short', 'elems el too short'],
      ['elems', {'elems':['string 0 2', '1 2']}, '["ass"]', 'Invalid string: too long', 'elems el string'],
      ['elems', {'elems':['string 0 2', '1 2']}, 'null', 'Invalid elems: null', 'elems null'],

      [{'+ bob':'user'}, {'user':{'+ name':'string 0 2'}},
        '{"bob":{"names":"bo"}}', 'Unknown key found: names', 'bob user bo required'],
      [{'+ bob':'user'}, {'user':{'+ name':'string 0 2'}},
        '{"bob":{"name":"bos"}}', 'Invalid string: too long', 'bob user bo too long'],
      [{'+ bob':'user'}, {'user':{'+ name':'string 0 2'}},
        '{"bob":null}', 'Invalid user: null', 'bob user null'],
      [['elems', '0 1'], {'elems':['string 0 2', '0 2']},
        '[["el"],[]]', 'Invalid array: too long', 'array too long'],
      [['elems', '0 1'], {'elems':['string 0 2', '0 2']},
        '[["els"]]', 'Invalid string: too long', 'string too long'],
      [['elems', '0 1'], {'elems':['string 0 2', '0 2']},
        '[null]', 'Invalid elems: null', '[elems null]'],

      ['tree', {'tree':{'+ leaf':'tree'}}, '{"leaf":{}}', 'Invalid tree: missing required field: leaf', 'obj tree missing leaf'],
      ['tree', {'tree':{'- leaf':'tree'}}, '{"leaf":null}', 'Invalid tree: null', 'obj tree invalid null'],
      ['tree', {'tree':{'- leaf':'tree','+ a': 'string 2 2'}}, '{"leaf":{"a":"z"}}', 'Invalid string: too short', 'obj tree string too short'],

      ['tree', {'tree':['tree','1 3']}, '[]', 'Invalid tree: too short', 'arr tree too short lvl 1'],
      ['tree', {'tree':['tree','1 3']}, '[[]]', 'Invalid tree: too short', 'arr tree too short lvl 2'],
      ['tree', {'tree':['tree','1 3']}, 'null', 'Invalid tree: null', 'arr tree null'],

      ['tree', {'tree':{'+ sth':['tree','1 3']}}, '{"sth":[{"sth":[]}]}', 'Invalid array: too short', 'obj-arr tree too short'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?invalid', () => {
    const tests = [
      ['?color', {'color':'enum red'}, '"reds"', 'Invalid ?color: too long', 'color red'],
      ['?name', {'name':'string 0 2'}, '"bos"', 'Invalid ?name: too long', 'name bo'],
      ['?user', {'user':{'+ name':'string 0 2'}}, '{}', 'Invalid ?user: missing required field: name', 'user bo'],
      ['?user', {'user':{'+ name':'string 0 2'}}, '{"name":"ass"}', 'Invalid string: too long', 'user bo string too long'],
      ['?elems', {'elems':['string 0 2', '1 2']}, '[]', 'Invalid ?elems: too short', 'elems too short'],
      ['?elems', {'elems':['string 0 2', '1 2']}, '["ass"]', 'Invalid string: too long', 'elems string too long'],

      [{'+ bob':'?user'}, {'user':{'+ name':'string 0 2'}},
        '{"bob":{"names":"bo"}}', 'Unknown key found: names', 'bob user bo required'],
      [{'+ bob':'?user'}, {'user':{'+ name':'string 0 2'}},
        '{"bob":{"name":"bos"}}', 'Invalid string: too long', 'bob user bo string too long'],
      [['?elems', '0 1'], {'elems':['string 0 2', '0 2']},
        '[["el"],[]]', 'Invalid array: too long', 'elems array too long'],
      [['?elems', '0 1'], {'elems':['string 0 2', '0 2']},
        '[["els"]]', 'Invalid string: too long', 'elems string too long'],

      ['?tree', {'tree':{'+ leaf':'tree'}}, '{"leaf":{}}', 'Invalid tree: missing required field: leaf', 'obj tree missing leaf'],
      ['?tree', {'tree':{'- leaf':'tree'}}, '{"leaf":null}', 'Invalid tree: null', 'obj tree invalid null'],
      ['?tree', {'tree':{'- leaf':'tree','+ a': 'string 2 2'}}, '{"leaf":{"a":"z"}}', 'Invalid string: too short', 'obj tree string too short'],

      ['?tree', {'tree':['tree','1 3']}, '[]', 'Invalid ?tree: too short', 'arr tree too short lvl 1'],
      ['?tree', {'tree':['tree','1 3']}, '[[]]', 'Invalid tree: too short', 'arr tree too short lvl 2'],

      ['?tree', {'tree':{'+ sth':['tree','1 3']}}, '{"sth":[{"sth":[]}]}', 'Invalid array: too short', 'obj-arr tree too short'],

    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('special cases', () => {
    const tests = [
      ['color', null, '""', 'Invalid Type. Expected: object, found: null', 'null for defs'],
      ['color', {"?color":"enum red green"}, '"red"', 'Invalid prefix. Expected: (not ?), found: (?)', 'question mark for def name'],
      ['string', {"string":"enum red green"}, '"red"', "Duplicate schema type: string", 'redefine string'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }

    it('redefine the previous definition', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_types({"color":"enum red green"})
        builder.add_derived_types({"color":"enum red green"})
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, "Duplicate schema type: color")
      }
    })
  })
})
