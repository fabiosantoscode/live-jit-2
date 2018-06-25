const assert = require('assert').strict
const parse = require('../lib/parse')

const { program1 } = require('./fixtures')

describe('parser', () => {
  it('can parse a program', () => {
    assert.deepEqual(
      parse(program1),
      [
        ['NOP'],  // line 1 ends up in position 0
        ['GOTO', 3],
        ['SET', 'x', 10],
        ['PRINT', 'x'],
        ['END']
      ]
    )
  })
})
