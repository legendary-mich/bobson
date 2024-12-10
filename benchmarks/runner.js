'use strict'

class Benchmark_Runner {
  constructor({ num_of_iter, num_of_op }) {
    this.num_of_iter = num_of_iter
    this.num_of_op = num_of_op
  }

  run(test_cases) {
    const num_of_iter = this.num_of_iter
    const num_of_op = this.num_of_op
    const results = test_cases.map(tc => new Array(num_of_iter.length))
    for (let iter = 0; iter < num_of_iter; ++iter) {
      for (let test = 0; test < test_cases.length; ++test) {
        const test_lbl = test_cases[test][0]
        const test_fn = test_cases[test][1]
        const start = performance.now()
        for (let op = 0; op < num_of_op; ++op) {
          test_fn()
        }
        const stop = performance.now()
        const duration = stop - start
        console.log(test_lbl, duration)
        results[test][iter] = duration
      }
    }
    // console.log('results', results)
    console.log('avg time for', num_of_iter * num_of_op, 'iterations:')
    for (let test = 0; test < test_cases.length; ++ test) {
      const sum = results[test].reduce((acc, v) => acc + v, 0)
      const avg = sum / results[test].length
      console.log('  ', test_cases[test][0], avg)
    }
  }

}

module.exports = {
  Benchmark_Runner,
}
