import App from './App';

const add = (a, b) => a + b;

describe('test jest', () => {
  test('test function add', () => {
    expect(add(1, 2)).toBe(3);
  })
})