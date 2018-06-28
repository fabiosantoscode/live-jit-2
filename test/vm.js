'use strict'

const assert = require('assert').strict
const vm = require('../lib/vm')
const { program1, count } = require('./fixtures')

function getStdout(program) {
  var stdout = []

  vm.run(program, {
    print: (msg) => stdout.push(msg)
  })

  return stdout.join('\n') + '\n'
}

describe('vm', () => {
  describe('single instructions', () => {
    it('GOTO', () => {
      const state = {}
      vm.step(state, ['GOTO', 1])
      assert.equal(state.pc, -1)
    })
    it('SET', () => {
      const state = { variables: { a: 0 } }
      vm.step(state, ['SET', 'a', 10])
      assert.equal(state.variables.a, 10)

      vm.step(state, ['SET', 'b', 10])
      assert.equal(state.variables.b, 10)
    })
    it('PRINT', () => {
      let printedValue = null
      const state = {
        variables: {
          a: 42
        },
        print: value => { printedValue = value }
      }
      vm.step(state, ['PRINT', 'a'])
      assert.equal(printedValue, 42)
      vm.step(state, ['PRINT', 43])
      assert.equal(printedValue, 43)
    })
    it('INCRBY', () => {
      const state = {
        variables: {
          a: 10
        }
      }
      vm.step(state, ['INCRBY', 'a', 5])
      assert.equal(state.variables.a, 15)
    })
    it('LESS_THAN_OR_GOTO', () => {
      const state = {
        variables: {
          a: 42,
          b: 43
        },
        pc: 1
      }
      vm.step(state, ['LESS_THAN_OR_GOTO', 'a', 'b', 100])
      assert.equal(state.pc, 1)

      state.variables.a = 44

      vm.step(state, ['LESS_THAN_OR_GOTO', 'a', 'b', 100])
      assert.equal(state.pc, 98)
    })
  })
  describe('whole programs', () => {
    it('simple program', () => {
      assert.equal(
        getStdout('print 123'),
        '123\n'
      )
    })
    it('more complex program', () => {
      assert.equal(
        getStdout(program1),
        '10\n'
      )
    })
    it('count numbers', function() {
      this.timeout(20 * 1000)
      assert.equal(
        getStdout(count),
        '5000000\n'
      )
    })
  })
})
