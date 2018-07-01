'use strict'

const assert = require('assert').strict
const compilation = require('../lib/compilation')

const exampleRecord = [
  ['SET', 'example', 1],
  ['PRINT', 'a'],
  ['PRINT', 42],
  ['INCRBY', 'a', 1],
  ['INCRBY', 'a', 'b'],
  ['GUARD', 'a', 'b', true, 123],
]

const executionRecord = [
  ['INCRBY', 'i', 1],
  ['GUARD', 10, 'i', true, 123],
  ['PRINT', 'i']
]

describe('compilation', () => {
  it('compiles traces to C', () => {
    const state = {
      traces: {
        42: exampleRecord
      },
      variables: {
        a: 1,
        b: 2
      }
    }
    assert.equal(
      compilation.compileTraceToC(state, 42),
String.raw`int main() {
int PC = 42;
int a = 1;
int b = 2;
int example = 0;
while (1) {
example = 1;
printf("%d\n", a);
printf("%d\n", 42);
a += 1;
a += b;
if ((a >= b) != 1) { PC = 123; break; }
}
printf("PC=%d&a=%d&b=%d&example=%d\n", PC, a, b, example);
return 42;
}`
    )
  })
  it('executes traces in C', () => {
    const stdout = []
    const state = {
      record: executionRecord,
      print: msg => stdout.push(msg),
      variables: {
        i: 0
      }
    }

    compilation.compileTrace(state, 42)

    assert.equal(state.traces[42], executionRecord)

    assert.equal(
      compilation.compileTraceToC(state, 42),
String.raw`int main() {
int PC = 42;
int i = 0;
while (1) {
i += 1;
if ((10 >= i) != 1) { PC = 123; break; }
printf("%d\n", i);
}
printf("PC=%d&i=%d\n", PC, i);
return 42;
}`)

    compilation.execTrace(state, 42)

    assert.deepEqual(stdout, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])

    assert.equal(state.variables.i, 11)
    assert.equal(state.pc, 123)
  })
})
