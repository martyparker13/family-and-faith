/* eslint-env jest */
// AsyncStorage has no native module in the jest environment — use the
// official in-memory mock so stores that persist can be imported in tests.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
