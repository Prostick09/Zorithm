// executorWorker.js

self.onmessage = function(e) {
  const { code, testCases } = e.data;

  try {
    // We wrap the user's string in a new Function that returns their 'solve'
    // To prevent total infinite loops stalling the worker invisibly, we can inject a basic check,
    // but the worker itself can also be terminated by the main thread on timeout.
    
    // eslint-disable-next-line no-new-func
    const runner = new Function(`
      ${code}
      return solve;
    `);

    const userSolveFn = runner();

    if (typeof userSolveFn !== 'function') {
      throw new Error("Your code must declare a 'solve' function.");
    }

    // Run against test cases
    for (let i = 0; i < testCases.length; i++) {
      const { input, expected } = testCases[i];
      // Clone input so user code doesn't falsely pass by mutator side effects if we compare strictly
      const inputClone = JSON.parse(JSON.stringify(input));
      
      const result = userSolveFn(inputClone);

      // Deep compare arrays for safety
      const isCorrect = JSON.stringify(result) === JSON.stringify(expected);

      if (!isCorrect) {
        self.postMessage({
          success: false,
          error: `Test Case ${i + 1} Failed: \nInput: ${JSON.stringify(input)}\nExpected: ${JSON.stringify(expected)}\nGot: ${JSON.stringify(result)}`
        });
        return;
      }
    }

    self.postMessage({ success: true, message: "All test cases passed!" });
  } catch (err) {
    self.postMessage({ success: false, error: err.toString() });
  }
};
