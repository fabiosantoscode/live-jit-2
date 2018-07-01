'use strict'

const assert = require('assert').strict
const querystring = require('querystring')
const { spawnSync } = require('child_process')
const uniq = require('lodash/uniq')
const mapValues = require('lodash/mapValues')

function hasTrace(state, startPc) {
  return Boolean(state.traces && state.traces[startPc])
}

const compilers = {
  SET(variable, value) {
    return `${variable} = ${value};`
  },
  PRINT(variable) {
    return `printf("%d\\n", ${variable});`
  },
  INCRBY(variable, increment) {
    return `${variable} += ${increment};`
  },
  GUARD(a, b, doesJump, targetPc) {
    return `if ((${a} >= ${b}) != ${doesJump|0}) { PC = ${targetPc}; break; }`
  }
}

function compileTrace(state, startPc) {
  if (!state.traces) state.traces = {}
  state.traces[startPc] = state.record
}

function compileTraceToC(state, startPc) {
  const variablesSet = state.traces[startPc]
    .filter(([instruction]) => instruction === 'SET')
    .map(([_, variableName]) => variableName)
  const variables = uniq(Object.keys(state.variables).concat(variablesSet))

  const variableDeclarations = [`int PC = ${startPc};\n`]
    .concat(
      variables.map(varName => `int ${varName} = ${state.variables[varName] || 0};\n`)
    )

  const program = state.traces[startPc].map(([instruction, ...args]) => compilers[instruction](...args) + '\n')

  const feedbackVariables = ['PC'].concat(variables)
  const feedback = `printf("${
    feedbackVariables.map(varName => `${varName}=%d`).join('&')
  }\\n", ${
    feedbackVariables.join(', ')
  });\n`

  return (
    'int main() {\n'
    + variableDeclarations.join('')
    + 'while (1) {\n'
    + program.join('')
    + '}\n'
    + feedback
    + 'return 42;\n'
    + '}'
  )
}

function execTrace(state, startPc) {
  assert(state.traces[startPc])

  const cProgram = compileTraceToC(state, startPc)

  const { stdout, stderr, status } = spawnSync(
    __dirname + '/../node_modules/streamed-tcc-goodness/build/tcc',
    ['-run', '-'], {
      input: cProgram,
      encoding: 'utf-8'
    }
  )

  if (status !== 42 || stderr) {
    throw new Error(stderr)
  }

  const stdoutLines = stdout.split(/\n/g).slice(0, -1)

  const lastLine = stdoutLines.pop()

  stdoutLines.forEach(line => state.print(line))

  const { PC, ...variables } = querystring.parse(lastLine)

  state.pc = Number(PC)

  state.variables = mapValues(variables, Number)
}

Object.assign(module.exports, { hasTrace, compileTrace, compileTraceToC, execTrace })

