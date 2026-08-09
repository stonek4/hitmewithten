/* global jest */
/**
 * Jest global setup for the Vocab Cards app.
 *
 * Keep this file to environment shims only — anything a *test* needs to control
 * belongs in the test itself.
 */

// `@react-native-async-storage/async-storage` reaches for a native module that
// does not exist under Jest. The package ships its own in-memory mock; use it
// rather than hand-rolling one, so the mock tracks the real API surface.
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-crypto's randomUUID() is a thin wrapper over the native module. Under
// Jest there is no native module, so back it with Node's own crypto — which
// produces genuine RFC-4122 v4 UUIDs, keeping identity tests honest.
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('crypto').randomUUID(),
}));
