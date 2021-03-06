import { HTMLTools } from '@blastjs/html-tools';
import { BlastTools } from '../src/preamble';

test('blast-tools - token parsers', () => {
  const run = function (func, input, expected) {
    const scanner = new HTMLTools.Scanner(`z${input}`);
    // make sure the parse function respects `scanner.pos`
    scanner.pos = 1;
    const result = func(scanner);
    if (expected === null) {
      expect(scanner.pos).toEqual(1);
      expect(result).toEqual(null);
    } else {
      expect(scanner.isEOF()).toBeTruthy();
      expect(result).toEqual(expected);
    }
  };

  const runValue = function (func, input, expectedValue) {
    let expected;
    if (expectedValue === null) {
      expected = null;
    } else {
      expected = { text: input, value: expectedValue };
    }
    run(func, input, expected);
  };

  const { parseNumber } = BlastTools;
  const { parseIdentifierName } = BlastTools;
  const { parseExtendedIdentifierName } = BlastTools;
  const { parseStringLiteral } = BlastTools;

  runValue(parseNumber, '0', 0);
  runValue(parseNumber, '-0', 0);
  runValue(parseNumber, '-', null);
  runValue(parseNumber, '.a', null);
  runValue(parseNumber, '.1', 0.1);
  runValue(parseNumber, '1.', 1);
  runValue(parseNumber, '1.1', 1.1);
  runValue(parseNumber, '0x', null);
  runValue(parseNumber, '0xa', 10);
  runValue(parseNumber, '-0xa', -10);
  runValue(parseNumber, '1e+1', 10);

  [parseIdentifierName, parseExtendedIdentifierName].forEach((f) => {
    run(f, 'a', 'a');
    run(f, 'true', 'true');
    run(f, 'null', 'null');
    run(f, 'if', 'if');
    run(f, '1', null);
    run(f, '1a', null);
    run(f, '+a', null);
    run(f, 'a1', 'a1');
    run(f, 'a1a', 'a1a');
    run(f, '_a8f_f8d88_', '_a8f_f8d88_');
  });
  run(parseIdentifierName, '@index', null);
  run(parseExtendedIdentifierName, '@index', '@index');
  run(parseExtendedIdentifierName, '@something', '@something');
  run(parseExtendedIdentifierName, '@', null);

  runValue(parseStringLiteral, '"a"', 'a');
  runValue(parseStringLiteral, '"\'"', "'");
  runValue(parseStringLiteral, '\'"\'', '"');
  runValue(parseStringLiteral, '"a\\\nb"', 'ab'); // line continuation
  runValue(parseStringLiteral, '"a\u0062c"', 'abc');
  // Note: IE 8 doesn't correctly parse '\v' in JavaScript.
  runValue(parseStringLiteral, '"\\0\\b\\f\\n\\r\\t\\v"', '\0\b\f\n\r\t\u000b');
  runValue(parseStringLiteral, '"\\x41"', 'A');
  runValue(parseStringLiteral, '"\\\\"', '\\');
  runValue(parseStringLiteral, '"\\\""', '\"');
  runValue(parseStringLiteral, '"\\\'"', '\'');
  runValue(parseStringLiteral, "'\\\\'", '\\');
  runValue(parseStringLiteral, "'\\\"'", '\"');
  runValue(parseStringLiteral, "'\\\''", '\'');

  expect(() => {
    run(parseStringLiteral, "'this is my string");
  }).toThrowError(/Unterminated string literal/);
});
