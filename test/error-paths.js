'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_derived_types({
  'custom_obj': {
    '+ id': 'int_js 0 100',
    '+ name': 'string 1 10',
  },
  'custom_alias': 'custom_obj',
})

function run_invalid_parse(t) {
  it(t[3], () => {
    try {
      const p = bobson.get_parser(t[0])
      p.parse(t[1])
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq({message: err.message, path: err.path}, t[2])
    }
  })
}

function run_invalid_parse_chunk(t) {
  it(t[3], () => {
    try {
      const p = bobson.get_parser(t[0])
      p.parse_chunk(t[1])
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq({message: err.message, path: err.path}, t[2])
    }
  })
}

function run_invalid_parse_query(t) {
  it(t[3], () => {
    try {
      bobson.parse_query_string(t[0], t[1])
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq({message: err.message, path: err.path}, t[2])
    }
  })
}

function run_invalid_parse_path_params(t) {
  it(t[3], () => {
    try {
      bobson.parse_path_params(t[0], t[1])
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq({message: err.message, path: err.path}, t[2])
    }
  })
}

describe('error-paths in parse', () => {
  const tests = [
    [
      {},
      '{"aba":"a"}', {
        message: 'Unknown key found: aba',
        path: 'object',
      },
      'unknown field',
    ],
    [
      {},
      '{', {
        message: 'Incomplete payload. Some characters are missing at the end',
        path: 'object',
      },
      'no enclosing char',
    ],
    [
      {},
      '{}lksd', {
        message: 'Parser has already finished. There are redundant characters after the enclosing char',
        path: '',
      },
      'after enclosing char',
    ],
    [
      {"+ aba": "string 0 3"},
      '{}', {
        message: 'Invalid object: missing required field: aba',
        path: 'object',
      },
      'missing required',
    ],
    [
      {"+ aba": "string 0 3"},
      '{"aba"}', {
        message: 'Invalid object member-colon. Expected: :, found: }',
        path: 'object.aba',
      },
      'invalid colon',
    ],
    [
      {"+ aba": "string 0 3"},
      '{"aba":}', {
        message: 'Invalid string opening char. Expected: ", found: }',
        path: 'object.aba',
      },
      'no value',
    ],
    [
      {"+ ola": {"+ aba": "string 0 0"}},
      '{"ola":{"aba":"a"}}', {
        message: 'Invalid string: too long',
        path: 'object.ola.aba',
      },
      'lvl-2 object',
    ],
    [
      ["string 2 3", "0 10"],
      'k', {
        message: 'Invalid array opening char. Expected: [, found: k',
        path: 'array',
      },
      'invalid array opening',
    ],
    [
      {"+ olo": ["string 2 3", "0 10"]},
      '{"olo":*}', {
        message: 'Invalid array opening char. Expected: [, found: *',
        path: 'object.olo',
      },
      'invalid array opening in an object',
    ],
    [
      {"+ ola": ["string 2 3", "0 10"]},
      '{"ola":["al","ba","zo","a","ho"]}', {
        message: 'Invalid string: too short',
        path: 'object.ola[3]',
      },
      'array in an object',
    ],
    [
      [["string 0 0", '0 3'], '0 1'],
      '[["","","a",""]]', {
        message: 'Invalid string: too long',
        path: 'array[0][2]',
      },
      'lvl-2 array',
    ],
    [
      [{"+ olo":"string 0 3"}, '0 1'],
      '[{"olo":"bora"}]', {
        message: 'Invalid string: too long',
        path: 'array[0].olo',
      },
      'object in an array',
    ],
    [
      [{"+ olo":"string 0 3"}, '0 1'],
      '[{}]', {
        message: 'Invalid object: missing required field: olo',
        path: 'array[0]',
      },
      'object in an array with no required field',
    ],
    [
      'custom_obj',
      '{"id":"-20","name":"john"}', {
        message: 'Invalid int_js: too small',
        path: 'custom_obj.id',
      },
      'custom_obj: id too small',
    ],
    [
      'custom_alias',
      '{"id":"-20","name":"john"}', {
        message: 'Invalid int_js: too small',
        path: 'custom_alias.id',
      },
      'custom_alias: id too small',
    ],
  ]
  for (const t of tests) {
    run_invalid_parse(t)
  }
})

describe('error-paths in parse_chunk', () => {
  const tests = [
    [
      {"+ ola": {"+ aba": "string 0 0"}},
      '{"ola":{"aba":"a"}}', {
        message: 'Invalid string: too long',
        path: 'object.ola.aba',
      },
      'lvl-2 object',
    ],
    [
      [["string 0 0", '0 3'], '0 1'],
      '[["","","a",""]]', {
        message: 'Invalid string: too long',
        path: 'array[0][2]',
      },
      'lvl-2 array',
    ],
    [
      [{"+ olo":"string 0 3"}, '0 1'],
      '[{"olo":"bora"}]', {
        message: 'Invalid string: too long',
        path: 'array[0].olo',
      },
      'object in an array',
    ],
    [
      'custom_obj',
      '{"id":"-20","name":"john"}', {
        message: 'Invalid int_js: too small',
        path: 'custom_obj.id',
      },
      'custom_obj: id too small',
    ],
    [
      'custom_alias',
      '{"id":"-20","name":"john"}', {
        message: 'Invalid int_js: too small',
        path: 'custom_alias.id',
      },
      'custom_alias: id too small',
    ],
  ]
  for (const t of tests) {
    run_invalid_parse_chunk(t)
  }
})

describe('error-paths in parse_query', () => {
  const tests = [
    [{"+ name":"string 2 3"}, '/status?na=r', {
      message: 'Unknown key found: na',
      path: 'object',
    }, 'name=r'],
    [{"+ name":"string 2 3"}, '/status?name=r', {
      message: 'Invalid string: too short',
      path: 'object.name',
    }, 'name=r'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, '/status?ids=1,2&name=r', {
      message: 'Invalid string: too short',
      path: 'object.name',
    }, 'arr name=r'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, '/status?ids=1,20&name=r', {
      message: 'Invalid int_4: too long',
      path: 'object.ids[1]',
    }, 'arr int too long 1'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, '/status?name=ra&ids=1,20', {
      message: 'Invalid int_4: too long',
      path: 'object.ids[1]',
    }, 'arr int too long 2'],
    ['custom_obj', '/status?id=-20&name=john', {
      message: 'Invalid int_js: too small',
      path: 'custom_obj.id',
    }, 'custom_obj: id too small'],
    ['custom_alias', '/status?id=-20&name=john', {
      message: 'Invalid int_js: too small',
      path: 'custom_alias.id',
    }, 'custom_alias: id too small'],
  ]
  for (const t of tests) {
    run_invalid_parse_query(t)
  }
})

describe('error-paths in parse_path_params', () => {
  const tests = [
    [{"+ name":"string 2 3"}, {na: 'r'}, {
      message: 'Unknown key found: na',
      path: 'object',
    }, 'name=r'],
    [{"+ name":"string 2 3"}, {name: 'r'}, {
      message: 'Invalid string: too short',
      path: 'object.name',
    }, 'name=r'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, {ids:'1,2',name:'r'}, {
      message: 'Invalid string: too short',
      path: 'object.name',
    }, 'arr name=r'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, {ids:'1,20',name:'r'}, {
      message: 'Invalid int_4: too long',
      path: 'object.ids[1]',
    }, 'arr int too long 1'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, {name:'ra',ids:'1,20'}, {
      message: 'Invalid int_4: too long',
      path: 'object.ids[1]',
    }, 'arr int too long 2'],
    ['custom_obj', {"id":"-20","name":"john"}, {
      message: 'Invalid int_js: too small',
      path: 'custom_obj.id',
    }, 'custom_obj: id too small'],
    ['custom_alias', {"id":"-20","name":"john"}, {
      message: 'Invalid int_js: too small',
      path: 'custom_alias.id',
    }, 'custom_alias: id too small'],
  ]
  for (const t of tests) {
    run_invalid_parse_path_params(t)
  }
})

describe('error-paths in schemas', () => {
  const tests = [
    [{"?":"what"}, '{na: "r"}', {
      message: 'Invalid Type. Expected: boolean, found: String',
      path: '.?',
    }, 'invalid ?'],
    [{
      "+ bobo": [
        {
          "+ lobo": {
            "+ zorro": ["string 2", "0 3"],
          },
        },
        "0 2"]}, '{na: "r"}', {
      message: 'Invalid max_length param for string schema: undefined',
      path: '.+ bobo[.+ lobo.+ zorro[',
    }, 'invalid leaf array'],
    [{
      "+ bobo": [
        {
          "+ lobo": {
            "+ zorro": ["string 2 3", "0 3"],
          },
        },
        "-1 2"]}, '{na: "r"}', {
      message: 'Invalid min_length param for array schema: -1',
      path: '.+ bobo',
    }, 'invalid intermediate array'],
  ]
  for (const t of tests) {
    run_invalid_parse(t)
  }

  it('derived types', () => {
    try {
      const bobson = new Bobson_Builder()
      bobson.add_derived_types({
        'custom_str': "string 0 12",
        'custom_obj': {
          '+ id': 'int_js 0 100',
          '+ name': 'string',
        },
      })
      throw new Error('should have thrown')
    }
    catch (err) {
      deepEq({message: err.message, path: err.path}, {
        message: 'Invalid min_length param for string schema: undefined',
        path: 'custom_obj.+ name',
      })
    }
  })
})
