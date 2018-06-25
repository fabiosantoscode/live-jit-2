'use strict'

const assert = require('assert').strict
const vm = require('../lib/vm')

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
  })
})
