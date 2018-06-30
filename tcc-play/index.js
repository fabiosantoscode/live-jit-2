
const { spawnSync } = require('child_process')

console.time('start')
const result = spawnSync(
  __dirname + '/node_modules/streamed-tcc-goodness/build/tcc',
  ['-run', '-'],
  {
    encoding: 'utf-8',
    input: `
      int main() {
        printf("hello C %s", "world!");
      }
    `
  })
console.timeEnd('start')

console.log(result.stdout+'')

