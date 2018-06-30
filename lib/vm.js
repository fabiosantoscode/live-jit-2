'use strict'

const assert = require('assert').strict
const parse = require('./parse')
const { hasTrace, compileTrace, execTrace } = require('./compilation')

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
  state.record = []
  state.recordStartPc = undefined
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
  return (
    instruction === 'GOTO' ? args[0] :
    instruction === 'LESS_THAN_OR_GOTO' ? args[2] :
    assert(false)
  ) - 1
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
      state.recordStartPc = jumpDest
    }
  }
}

const MAX_TRACE_STEPS = 100

function recordTraceStep(state, instruction, args) {
  assert(state.recordStartPc != null)
  if (state.pc === state.recordStartPc) {
    if (!state.record.length) return
    compileTrace(state, state.pc)
    resetJitState(state)
  }

  if (state.record.length > MAX_TRACE_STEPS) {
    // Abort
    resetJitState(state)
    return
  }

  if (instruction === 'NOP' || instruction === 'GOTO') {
    return
  }

  if (instruction === 'LESS_THAN_OR_GOTO') {
    const doesJump = toConstant(state, args[0]) >= toConstant(state, args[1])

    state.record.push(['GUARD', args[0], args[1], doesJump, doesJump ? state.pc : args[2] - 1])
    return
  }

  return state.record.push([instruction, ...args])
}

function step(state, [instruction, ...args]) {
  if (state.isJit) {
    let jumpDest
    if (state.tracingMode === 'monitoring'
      && isJump(state, instruction, args)
      && (jumpDest = getJumpDestination(state, instruction, args)) < state.pc
    ) {
      monitorBackwardsJump(state, instruction, args, jumpDest)
    } else if (state.tracingMode === 'recording') {
      recordTraceStep(state, instruction, args)
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

