'use strict'

const assert = require('assert').strict

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
  }
}

exports.step = function step(state, [instruction, ...args]) {
  return instructions[instruction](state, ...args)
}
