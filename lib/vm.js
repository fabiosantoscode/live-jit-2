'use strict'

const assert = require('assert').strict
const parse = require('./parse')

// Checks if it's a constant or a variable
// Gets the actual integer value of a variable if it's a variable
// Just returns the value if it's already a value
function toConstant(state, variableOrValue) {
  if (typeof variableOrValue === 'number') {
    // It's a literal value
    return variableOrValue
  }
  assert(variableOrValue in state.variables, 'Unknown variable ' + variableOrValue)
  return state.variables[variableOrValue]
}

const instructions = {
  NOP() {},
  GOTO(state, target) {
    state.pc = target - 1 /* lines are 1-based */ - 1 /* next line is just state.pc++ */
  },
  SET(state, variable, value) {
    assert(typeof variable === 'string', 'cannot SET value ' + variable)
    state.variables[variable] = toConstant(state, value)
  },
  PRINT(state, variableOrValue) {
    state.print(toConstant(state, variableOrValue))
  },
  INCRBY(state, variable, value) {
    assert(variable in state.variables)
    state.variables[variable] += toConstant(state, value)
  },
  LESS_THAN_OR_GOTO(state, a, b, target) {
    a = toConstant(state, a)
    b = toConstant(state, b)

    if (a >= b) this.GOTO(state, target)
  }
}

function step(state, [instruction, ...args]) {
  return instructions[instruction](state, ...args)
}

function run(program, state = {}) {
  if (typeof program === 'string') program = parse(program)

  state.pc = state.pc || 0
  state.variables = state.variables || {}
  state.print = state.print || function (msg) { console.log(msg) }

  let instruction
  while ((instruction = program[state.pc])[0] !== 'END') {
    step(state, instruction)
    state.pc++
  }
}

Object.assign(exports, { step, run })

