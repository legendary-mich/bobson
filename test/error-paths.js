'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')
const bobson = new Bobson_Builder()
bobson.add_derived_types({
  'custom_obj': {
    '+ id': 'int_js 0 100',
    '+ name': 'string 1 10',
  },
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
        path: '',
      },
      'unknown field',
    ],
    [
      {},
      '{', {
        message: 'Incomplete payload. Some characters are missing at the end',
        path: '',
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
        path: '',
      },
      'missing required',
    ],
    [
      {"+ aba": "string 0 3"},
      '{"aba"}', {
        message: 'Invalid object member-colon. Expected: :, found: }',
        path: '.aba',
      },
      'invalid colon',
    ],
    [
      {"+ aba": "string 0 3"},
      '{"aba":}', {
        message: 'Invalid string opening char. Expected: ", found: }',
        path: '.aba',
      },
      'no value',
    ],
    [
      {"+ ola": {"+ aba": "string 0 0"}},
      '{"ola":{"aba":"a"}}', {
        message: 'Invalid string: too long',
        path: '.ola.aba',
      },
      'lvl-2 object',
    ],
    [
      ["string 2 3", "0 10"],
      'k', {
        message: 'Invalid array opening char. Expected: [, found: k',
        path: '',
      },
      'invalid array opening',
    ],
    [
      {"+ olo": ["string 2 3", "0 10"]},
      '{"olo":*}', {
        message: 'Invalid array opening char. Expected: [, found: *',
        path: '.olo',
      },
      'invalid array opening in an object',
    ],
    [
      {"+ ola": ["string 2 3", "0 10"]},
      '{"ola":["al","ba","zo","a","ho"]}', {
        message: 'Invalid string: too short',
        path: '.ola[3]',
      },
      'array in an object',
    ],
    [
      [["string 0 0", '0 3'], '0 1'],
      '[["","","a",""]]', {
        message: 'Invalid string: too long',
        path: '[0][2]',
      },
      'lvl-2 array',
    ],
    [
      [{"+ olo":"string 0 3"}, '0 1'],
      '[{"olo":"bora"}]', {
        message: 'Invalid string: too long',
        path: '[0].olo',
      },
      'object in an array',
    ],
    [
      [{"+ olo":"string 0 3"}, '0 1'],
      '[{}]', {
        message: 'Invalid object: missing required field: olo',
        path: '[0]',
      },
      'object in an array with no required field',
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
        path: '.ola.aba',
      },
      'lvl-2 object',
    ],
    [
      [["string 0 0", '0 3'], '0 1'],
      '[["","","a",""]]', {
        message: 'Invalid string: too long',
        path: '[0][2]',
      },
      'lvl-2 array',
    ],
    [
      [{"+ olo":"string 0 3"}, '0 1'],
      '[{"olo":"bora"}]', {
        message: 'Invalid string: too long',
        path: '[0].olo',
      },
      'object in an array',
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
      path: '',
    }, 'name=r'],
    [{"+ name":"string 2 3"}, '/status?name=r', {
      message: 'Invalid string: too short',
      path: '.name',
    }, 'name=r'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, '/status?ids=1,2&name=r', {
      message: 'Invalid string: too short',
      path: '.name',
    }, 'arr name=r'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, '/status?ids=1,20&name=r', {
      message: 'Invalid int_4: too long',
      path: '.ids[1]',
    }, 'arr int too long 1'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, '/status?name=ra&ids=1,20', {
      message: 'Invalid int_4: too long',
      path: '.ids[1]',
    }, 'arr int too long 2'],
  ]
  for (const t of tests) {
    run_invalid_parse_query(t)
  }
})

describe('error-paths in parse_path_params', () => {
  const tests = [
    [{"+ name":"string 2 3"}, {na: 'r'}, {
      message: 'Unknown key found: na',
      path: '',
    }, 'name=r'],
    [{"+ name":"string 2 3"}, {name: 'r'}, {
      message: 'Invalid string: too short',
      path: '.name',
    }, 'name=r'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, {ids:'1,2',name:'r'}, {
      message: 'Invalid string: too short',
      path: '.name',
    }, 'arr name=r'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, {ids:'1,20',name:'r'}, {
      message: 'Invalid int_4: too long',
      path: '.ids[1]',
    }, 'arr int too long 1'],
    [{"+ ids":["int_4 0 9", "0 3"],"+ name":"string 2 3"}, {name:'ra',ids:'1,20'}, {
      message: 'Invalid int_4: too long',
      path: '.ids[1]',
    }, 'arr int too long 2'],
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
