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

function resetJitState(state) {
  assert(state.isJit)
  state.tracingMode = 'monitoring'
  state.pcTemperature = {}
}

function isJump(state, instruction, args) {
  if (instruction === 'GOTO') {
    return true
  }
  if (instruction === 'LESS_THAN_OR_GOTO') {
    return toConstant(state, args[0]) >= toConstant(state, args[1])
  }
  return false
}

function getJumpDestination(state, instruction, args) {
  return instruction === 'GOTO' ? args[0] :
    instruction === 'LESS_THAN_OR_GOTO' ? args[2] :
      assert(false)
}

function hasTrace(state, startPc) {
  return false
}

function execTrace(state, startPc) {
  assert(false, 'not implemented')
}

function monitorBackwardsJump(state, instruction, args, jumpDest) {
  // This is a backwards jump instruction
  state.pcTemperature[jumpDest] = (state.pcTemperature[jumpDest] || 0) + 1
  if (state.pcTemperature[jumpDest] >= HOT_PC_THRESHOLD) {
    if (hasTrace(state, jumpDest)) {
      // Go to executing mode
      execTrace(state, jumpDest)
    } else {
      // Go to recording mode
      resetJitState(state)
      state.tracingMode = 'recording'
    }
  }
}

function step(state, [instruction, ...args]) {
  if (state.isJit) {
    let jumpDest
    if (state.tracingMode === 'monitoring'
      && isJump(state, instruction, args)
      && (jumpDest = getJumpDestination(state, instruction, args)) < state.pc
    ) {
      monitorBackwardsJump(state, instruction, args, jumpDest)
    }
  }
  return instructions[instruction](state, ...args)
}

const HOT_PC_THRESHOLD = 10

function run(program, state = {}) {
  if (typeof program === 'string') program = parse(program)

  state.pc = state.pc || 0
  state.variables = state.variables || {}
  state.print = state.print || function (msg) { console.log(msg) }
  state.isJit = state.isJit || false
  if (state.isJit) {
    resetJitState(state)
  }

  let trace

  let instruction
  while ((instruction = program[state.pc])[0] !== 'END') {
    step(state, instruction)
    state.pc++
  }
}

Object.assign(exports, { step, run })

