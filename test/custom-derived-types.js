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
      ['space in the name', {'space in the name':'enum red blue'}, '"blue"', 'blue', 'space in the name blue'],
      ['name', {'name':'string 0 2'}, '"bo"', 'bo', 'name bo'],
      ['user', {'user':["object",{'+ name':'string 0 2'}]}, '{"name":"bo"}', {name:"bo"}, 'user bo'],
      ['elems', {'elems':['array 0 2', 'string 0 2']}, '["el"]', ['el'], 'elems el'],

      [["object",{'+ bob':'user'}], {'user':["object",{'+ name':'string 0 2'}]},
        '{"bob":{"name":"bo"}}', {bob:{name:"bo"}}, 'bob user bo'],
      [['array 0 1', 'elems'], {'elems':['array 0 2', 'string 0 2']},
        '[["el"]]', [['el']], '[elems el]'],

      [["object",{'+ bob':'user','+ ola':'user'}], {'user':["object",{'+ name':'string 0 2'}]},
        '{"bob":{"name":"bo"},"ola":{"name":"ha"}}',
        {bob:{name:"bo"},ola:{name:"ha"}}, 'bob,ola user'],
      [['array 0 2', 'elems'], {'elems':['array 0 2', 'string 0 2']},
        '[["el"],["ol"]]', [['el'],['ol']], '[elems el ol]'],

      ['tree', {'tree':["object",{'- leaf':'tree'}]}, '{"leaf":{}}', {leaf:{}}, 'obj tree'],
      ['tree', {'tree':["object",{'+ sth':["object",{'- leaf':'tree'}]}]}, '{"sth":{"leaf":{"sth":{}}}}', {sth:{leaf:{sth:{}}}}, 'obj tree 2x sth'],
      ['tree', {'tree':["object",{'+ sth':["object",{'- leaf':'tree'}]}]}, '{"sth":{"leaf":{"sth":{"leaf":{"sth":{}}}}}}', {sth:{leaf:{sth:{leaf:{sth:{}}}}}}, 'obj tree 3x sth'],

      ['space in the name', {'space in the name':["object",{'- leaf':'space in the name'}]}, '{"leaf":{}}', {leaf:{}}, 'obj tree with space in the name'],

      ['tree', {'tree':["object",{'- a':'string 0 1','- leaf':'tree','- b':'string 0 1'}]}, '{"leaf":{"a":"x","leaf":{},"b":"y"}}', {leaf:{a:'x',b:'y',leaf:{}}}, 'obj mixed fields'],

      ['tree', {'tree':['array 0 3','tree']}, '[]', [], 'arr tree lvl 0'],
      ['tree', {'tree':['array 0 3','tree']}, '[[],[]]', [[],[]], 'arr tree lvl 1'],
      ['tree', {'tree':['array 0 3','tree']}, '[[[],[]],[]]', [[[],[]],[]], 'arr tree lvl 2'],

      ['tree', {'tree':["object",{'+ sth':['array 0 3','tree']}]}, '{"sth":[]}', {sth:[]}, 'obj-arr tree lvl 0'],
      ['tree', {'tree':["object",{'+ sth':['array 0 3','tree']}]}, '{"sth":[{"sth":[]}]}', {sth:[{sth:[]}]}, 'obj-arr tree lvl 1'],
      ['tree', {'tree':["object",{'+ sth':['array 0 3','tree']}]}, '{"sth":[{"sth":[{"sth":[]},{"sth":[]}]}]}', {sth:[{sth:[{sth:[]},{sth:[]}]}]}, 'obj-arr tree lvl 2'],

      ['tree', {'tree':['array 0 3',["object",{'+ sth':'tree'}]]}, '[]', [], 'arr-obj tree lvl 0'],
      ['tree', {'tree':['array 0 3',["object",{'+ sth':'tree'}]]}, '[{"sth":[]}]', [{sth:[]}], 'arr-obj tree lvl 1'],
      ['tree', {'tree':['array 0 3',["object",{'+ sth':'tree'}]]}, '[{"sth":[{"sth":[]},{"sth":[]}]}]', [{sth:[{sth:[]},{sth:[]}]}], 'arr-obj tree lvl 2'],
    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('?valid', () => {
    const tests = [
      ['?color', {'color':'enum red'}, '"red"', 'red', 'color red'],
      ['?color', {'color':'enum red'}, 'null', null, 'color null'],
      ['?space in the name', {'space in the name':'enum red blue'}, '"blue"', 'blue', 'space in the name blue'],
      ['?space in the name', {'space in the name':'enum red blue'}, 'null', null, 'space in the name null'],
      ['?name', {'name':'string 0 2'}, '"bo"', 'bo', 'name bo'],
      ['?name', {'name':'string 0 2'}, 'null', null, 'name null'],
      ['?user', {'user':["object",{'+ name':'string 0 2'}]}, '{"name":"bo"}', {name:"bo"}, 'user bo'],
      ['?user', {'user':["object",{'+ name':'string 0 2'}]}, 'null', null, 'user null'],
      ['?elems', {'elems':['array 0 2', 'string 0 2']}, '["el"]', ['el'], 'elems el'],
      ['?elems', {'elems':['array 0 2', 'string 0 2']}, 'null', null, 'elems null'],

      [["object",{'+ bob':'?user'}], {'user':["object",{'+ name':'string 0 2'}]},
        '{"bob":{"name":"bo"}}', {bob:{name:"bo"}}, 'bob user bo'],
      [["object",{'+ bob':'?user'}], {'user':["object",{'+ name':'string 0 2'}]},
        '{"bob":null}', {bob:null}, 'bob user null'],
      [['array 0 1', '?elems'], {'elems':['array 0 2', 'string 0 2']},
        '[["el"]]', [['el']], '[elems el]'],
      [['array 0 1', '?elems'], {'elems':['array 0 2', 'string 0 2']},
        '[null]', [null], '[elems null]'],

      ['?tree', {'tree':["object",{'- leaf':'tree'}]}, 'null', null, 'obj tree lvl 0'],
      ['tree', {'tree':["object",{'- leaf':'?tree'}]}, '{"leaf":null}', {leaf:null}, 'obj tree lvl 1'],

      ['?space in the name', {'space in the name':["object",{'- leaf':'?space in the name'}]}, '{"leaf":{}}', {leaf:{}}, 'obj tree with space in the name: value'],
      ['?space in the name', {'space in the name':["object",{'- leaf':'?space in the name'}]}, '{"leaf":null}', {leaf:null}, 'obj tree with space in the name: null'],

      ['?tree', {'tree':['array 0 3','tree']}, 'null', null, 'arr tree lvl 0'],
      ['tree', {'tree':['array 0 3','?tree']}, '[null]', [null], 'arr tree lvl 1'],

    ]
    for (const t of tests) {
      run_valid(t)
    }
  })

  describe('invalid', () => {
    const tests = [
      ['color', {'color':'enum red'}, '"reds"', 'Invalid color: too long', 'color red'],
      ['color', {'color':'enum red'}, 'null', 'Invalid color: null', 'color null'],
      ['space in the name', {'space in the name':'enum red blue'}, '"blues"', 'Invalid space in the name: too long', 'space in the name too long'],
      ['space in the name', {'space in the name':'enum red blue'}, 'null', 'Invalid space in the name: null', 'space in the name null'],
      ['name', {'name':'string 0 2'}, '"bos"', 'Invalid name: too long', 'name bo'],
      ['name', {'name':'string 0 2'}, 'null', 'Invalid name: null', 'name null'],
      ['user', {'user':["object",{'+ name':'string 0 2'}]}, '{}', 'Invalid user: missing required field: name', 'user bo required'],
      ['user', {'user':["object",{'+ name':'string 0 2'}]}, '{"name":"ass"}', 'Invalid string: too long', 'user bo string too long'],
      ['user', {'user':["object",{'+ name':'string 0 2'}]}, 'null', 'Invalid user: null', 'user null'],
      ['elems', {'elems':['array 1 2', 'string 0 2']}, '[]', 'Invalid elems: too short', 'elems el too short'],
      ['elems', {'elems':['array 1 2', 'string 0 2']}, '["ass"]', 'Invalid string: too long', 'elems el string'],
      ['elems', {'elems':['array 1 2', 'string 0 2']}, 'null', 'Invalid elems: null', 'elems null'],

      [["object",{'+ bob':'user'}], {'user':["object",{'+ name':'string 0 2'}]},
        '{"bob":{"names":"bo"}}', 'Unknown key found: names', 'bob user bo required'],
      [["object",{'+ bob':'user'}], {'user':["object",{'+ name':'string 0 2'}]},
        '{"bob":{"name":"bos"}}', 'Invalid string: too long', 'bob user bo too long'],
      [["object",{'+ bob':'user'}], {'user':["object",{'+ name':'string 0 2'}]},
        '{"bob":null}', 'Invalid user: null', 'bob user null'],
      [['array 0 1', 'elems'], {'elems':['array 0 2', 'string 0 2']},
        '[["el"],[]]', 'Invalid array: too long', 'array too long'],
      [['array 0 1', 'elems'], {'elems':['array 0 2', 'string 0 2']},
        '[["els"]]', 'Invalid string: too long', 'string too long'],
      [['array 0 1', 'elems'], {'elems':['array 0 2', 'string 0 2']},
        '[null]', 'Invalid elems: null', '[elems null]'],

      ['tree', {'tree':["object",{'+ leaf':'tree'}]}, '{"leaf":{}}', 'Invalid tree: missing required field: leaf', 'obj tree missing leaf'],
      ['tree', {'tree':["object",{'- leaf':'tree'}]}, '{"leaf":null}', 'Invalid tree: null', 'obj tree invalid null'],
      ['tree', {'tree':["object",{'- leaf':'tree','+ a': 'string 2 2'}]}, '{"leaf":{"a":"z"}}', 'Invalid string: too short', 'obj tree string too short'],

      ['tree', {'tree':['array 1 3','tree']}, '[]', 'Invalid tree: too short', 'arr tree too short lvl 1'],
      ['tree', {'tree':['array 1 3','tree']}, '[[]]', 'Invalid tree: too short', 'arr tree too short lvl 2'],
      ['tree', {'tree':['array 1 3','tree']}, 'null', 'Invalid tree: null', 'arr tree null'],

      ['tree', {'tree':["object",{'+ sth':['array 1 3','tree']}]}, '{"sth":[{"sth":[]}]}', 'Invalid array: too short', 'obj-arr tree too short'],
    ]
    for (const t of tests) {
      run_invalid(t)
    }
  })

  describe('?invalid', () => {
    const tests = [
      ['?color', {'color':'enum red'}, '"reds"', 'Invalid ?color: too long', 'color red'],
      ['?space in the name', {'space in the name':'enum red blue'}, '"blues"', 'Invalid ?space in the name: too long', 'space in the name too long'],
      ['?name', {'name':'string 0 2'}, '"bos"', 'Invalid ?name: too long', 'name bo'],
      ['?user', {'user':["object",{'+ name':'string 0 2'}]}, '{}', 'Invalid ?user: missing required field: name', 'user bo'],
      ['?user', {'user':["object",{'+ name':'string 0 2'}]}, '{"name":"ass"}', 'Invalid string: too long', 'user bo string too long'],
      ['?elems', {'elems':['array 1 2', 'string 0 2']}, '[]', 'Invalid ?elems: too short', 'elems too short'],
      ['?elems', {'elems':['array 1 2', 'string 0 2']}, '["ass"]', 'Invalid string: too long', 'elems string too long'],

      [["object",{'+ bob':'?user'}], {'user':["object",{'+ name':'string 0 2'}]},
        '{"bob":{"names":"bo"}}', 'Unknown key found: names', 'bob user bo required'],
      [["object",{'+ bob':'?user'}], {'user':["object",{'+ name':'string 0 2'}]},
        '{"bob":{"name":"bos"}}', 'Invalid string: too long', 'bob user bo string too long'],
      [['array 0 1', '?elems'], {'elems':['array 0 2', 'string 0 2']},
        '[["el"],[]]', 'Invalid array: too long', 'elems array too long'],
      [['array 0 1', '?elems'], {'elems':['array 0 2', 'string 0 2']},
        '[["els"]]', 'Invalid string: too long', 'elems string too long'],

      ['?tree', {'tree':["object",{'+ leaf':'tree'}]}, '{"leaf":{}}', 'Invalid tree: missing required field: leaf', 'obj tree missing leaf'],
      ['?tree', {'tree':["object",{'- leaf':'tree'}]}, '{"leaf":null}', 'Invalid tree: null', 'obj tree invalid null'],
      ['?tree', {'tree':["object",{'- leaf':'tree','+ a': 'string 2 2'}]}, '{"leaf":{"a":"z"}}', 'Invalid string: too short', 'obj tree string too short'],

      ['?tree', {'tree':['array 1 3','tree']}, '[]', 'Invalid ?tree: too short', 'arr tree too short lvl 1'],
      ['?tree', {'tree':['array 1 3','tree']}, '[[]]', 'Invalid tree: too short', 'arr tree too short lvl 2'],

      ['?tree', {'tree':["object",{'+ sth':['array 1 3','tree']}]}, '{"sth":[{"sth":[]}]}', 'Invalid array: too short', 'obj-arr tree too short'],

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

  describe('special cases for add_derived_type (no s at the end)', () => {
    it('key is not a string', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_type(null)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: string, found: null')
      }
    })

    it('key is prefixed', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_type('?lol')
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid prefix. Expected: (not ?), found: (?)')
      }
    })

    it('mixins is not an object', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_type('lol', 'string 0 12', 2)
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid Type. Expected: object, found: Number')
      }
    })

    it('parser_fn is not a function', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_type('lol', 'string 0 12', {
          parser_fn: null,
          serializer_fn: () => {},
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid parser_fn. Expected: function, found: null')
      }
    })

    it('serializer_fn is not a function', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_type('lol', 'string 0 12', {
          parser_fn: () => {},
          serializer_fn: 2,
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid serializer_fn. Expected: function, found: Number')
      }
    })

    it('integer comparer_fn is not a function', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_type('lol', 'int_js 0 12', {
          parser_fn: () => {},
          serializer_fn: () => {},
          comparer_fn: 'bobo',
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'mixins.comparer_fn is not a function')
        // The message is clear, even though the expected one would be:
        // deepEq(err.message, 'Invalid Type. Expected: function, found: String')
      }
    })

    it('decimal comparer_fn is not a function', () => {
      try {
        const builder = new Bobson_Builder()
        builder.add_derived_type('lol', 'decimal 0 12', {
          parser_fn: () => {},
          serializer_fn: () => {},
          comparer_fn: 'bobo',
        })
        throw new Error('should have thrown')
      }
      catch (err) {
        deepEq(err.message, 'Invalid comparer_fn. Expected: function, found: String')
      }
    })
  })
})
