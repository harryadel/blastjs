import { isModern } from '../src/modern';

test('modern-browsers - versions - basic', () => {
  expect(isModern({
    name: 'chrome',
    major: 60,
  })).toBeTruthy();

  expect(isModern({
    name: 'chromeMobile',
    major: 60,
  })).toBeTruthy();

  expect(isModern({
    name: 'firefox',
    major: 25,
  })).toBeFalsy();

  expect(isModern({
    name: 'safari',
    major: 10,
    minor: 2,
  })).toBeTruthy();

  expect(isModern({
    name: 'safari',
    major: 9,
    minor: 5,
    patch: 2,
  })).toBeFalsy();
});
