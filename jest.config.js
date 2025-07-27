// jest.config.js
module.exports = {
  // Specifies the test environment that will be used for testing.
  // 'node' is suitable for backend Node.js applications.
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files.
  // This configuration looks for files ending with .test.js or .spec.js
  // within the __tests__ directory.
  testMatch: ['**/__tests__/**/*.test.js'],

  // An array of paths to modules that run some code to configure or set up the testing framework before each test.
  // This is where we'll set up our global mocks for Mongoose and Firebase Admin.
  setupFilesAfterEnv: ['./setupTests.js'],

  // A list of paths to modules that Jest should use to import Node.js modules.
  // This is useful for aliasing paths, but not strictly necessary for this setup.
  moduleDirectories: ['node_modules', 'src'],

  // Indicates whether each individual test should be reported during the run.
  // verbose: true will show individual test results.
  verbose: true,

  // Automatically clear mock calls and instances between every test.
  // This is crucial for ensuring tests are independent and don't affect each other.
  clearMocks: true,

  // Increase the default timeout for tests to 10 seconds (10000 ms).
  // This helps prevent false positives for timeouts if tests are just slow,
  // or if asynchronous operations take a bit longer to resolve.
  testTimeout: 5000,
};
