'use strict'

const assert = require('assert').strict

// IRL you would use a parser generator
// like pegjs or a descendant of lex/yacc
module.exports = function parse(program) {
  program += '\nEND'

  return program.split('\n')
    .map(line => line.trim().split(/\s+/g))
    .map(([instruction, ...args]) => {
      instruction = instruction.toUpperCase()
      if (instruction === '#' || instruction === '') {
        return ['NOP']
      }
      args = args.map(
        (arg) => (
          /^\d+$/.test(arg) ? Number(arg) :
          /\w+/.test(arg) ? arg :
            assert(false, 'Unexpected ' + arg)
        )
      )
      return [instruction, ...args]
    })
}