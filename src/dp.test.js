import DPUtil from './DPUtil';

jest.mock('./DPUtil/utils', () => {
  return {
    getObserverLastDpTime: async(dpKey) => {
      if(typeof dpKey === 'string'){
        return Promise.resolve(666)
      } else {
        return Promise.resolve([666])
      }
    },
    dpKeyWrap: (d) => Symbol(d),
  }
})

describe('DPUtil 测试用例', () => {
  const DP = DPUtil.createPageDp();

  test('测试 DPUtil 实例化', () => {
    expect(DP).not.toBeUndefined();
  })

  test('监听单个dp点 DP.listen', async(done) => {
    const cb = jest.fn(value => {
      expect(value).toBe(1);
      done();
    });

    await DP.listen('haha').reply(cb);

    DP.mock({ haha: 1 });

    expect(cb).toHaveBeenCalledTimes(1);
  })

  test('监听dp数组 DP.listenDps', async(done) => {
    const dpsCb = jest.fn(value => {
      expect(value).toEqual({ a: 1, b: 2 });
      done();
    });

    await DP.listenDps(['a', 'b']).reply(dpsCb);

    DP.mock({ a: 1, b: 2, c: 3 });

    expect(dpsCb).toHaveBeenCalledTimes(1);
  })
})