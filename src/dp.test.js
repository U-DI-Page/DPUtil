import DPUtil from './DPUtil';

jest.mock('./DPUtil/utils', () => {
  return {
    ...jest.requireActual('./DPUtil/utils'),
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

beforeEach(() => {
  jest.useFakeTimers();
  // jest.setTimeout(10000);
})

describe('DPUtil 测试用例', () => {
  const DP = DPUtil.createPageDp();

  test('测试 DPUtil 实例化', () => {
    expect(DP).toBeInstanceOf(DPUtil);
  })

  test('监听单个dp点 DP.listen', async(done) => {
    expect.assertions(2);
    const cb = jest.fn(value => {
      expect(value).toBe(1);
      expect(cb).toBeCalledTimes(1);
      done();
    });

    DP.listen('haha').reply(cb);
    DP.mock({ haha: 1 });
  })

  test('监听dp数组 DP.listenDps', async(done) => {
    expect.assertions(1);
    const dpsCb = jest.fn(value => {
      expect(value).toEqual({ a: 1, b: 2 });
      done();
    });

    await DP.listenDps(['a', 'b']).reply(dpsCb);

    jest.runAllTimers();

    DP.mock({ a: 1, b: 2, c: 3 });
  })

  test('监听超时事件 timeout, 完成后销毁', async(done) => {
    expect.assertions(1);
    const timeoutCb = jest.fn();
    const replyCb = jest.fn();

    DP.listemWithinTime('hhh', 3 * 1000).timeout(timeoutCb).reply(replyCb);

    jest.advanceTimersByTime(3000);

    expect(timeoutCb).toHaveBeenCalledTimes(1);

    DP.mock({ hhh: 666 });
    done();
  })

  test('监听 onChange 事件', async(done) => {
    expect.assertions(5);
    const onChangeCb = jest.fn(data => {
      expect(data.type).toBe('dpData');
    });

    const onChangeCb2 = jest.fn();

    DP.onChange(onChangeCb);
    DP.onChange(onChangeCb2);

    DP.mock({ hah: 666 });

    expect(onChangeCb).toHaveBeenCalledTimes(1);

    DP.mock({ hah: 666 });

    expect(onChangeCb).toHaveBeenCalledTimes(2);
    expect(onChangeCb2).toHaveBeenCalledTimes(2);
    done();
  })
})