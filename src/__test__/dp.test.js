import './setup';
import DPUtil from '../DPUtil';

describe('DPUtil 测试用例', () => {
  /** 模拟上报 */
  const mockReport = async(dps) => {
    const tuyaKit = require('tuya-panel-kit');
    const triggleListenCb = tuyaKit.TYSdk.event.on.mock.calls.find(call => call[0] === 'deviceDataChange')[1];
    await triggleListenCb({ type: 'dpData', payload: dps });
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  })

  test('测试 DPUtil 实例化', () => {
    const DP = DPUtil.createPageDp();
    expect(DP).toBeInstanceOf(DPUtil);
  })

  test('监听单个dp点 DP.listen', async() => {
    expect.assertions(2);
    const DP = DPUtil.createPageDp();
    const cb = jest.fn(value => {
      expect(value).toBe(666);
    });
    DP.listen('haha').reply(cb);
    await mockReport({ haha: 666 });
    expect(cb).toHaveBeenCalledTimes(1);
  })

  test('监听dp数组 DP.listenDps', async() => {
    expect.assertions(2);
    const DP = DPUtil.createPageDp();
    const dpsCb = jest.fn(value => {
      expect(value).toEqual({ a: 1, b: 2 });
    });

    DP.listenDps(['a', 'b']).reply(dpsCb);

    await mockReport({ a: 1, b: 2, c: 3 });

    expect(dpsCb).toHaveBeenCalledTimes(1);
  })

  test.only('监听超时事件 timeout, 完成后销毁', async() => {
    // expect.assertions(4);
    const DP = DPUtil.createPageDp();

    const replyCb = jest.fn();
    const timeoutCb = jest.fn();

    /** 回复了就不触发 timeout 事件， 触发 reply 事件 */
    DP.listemWithinTime('hhh', 3 * 1000).reply(replyCb).timeout(timeoutCb);
    jest.clearAllTimers()
    await mockReport({ hhh: 666 });
    expect(replyCb).toHaveBeenCalledTimes(1);
    expect(timeoutCb).toHaveBeenCalledTimes(0);
  
    /** 未回复则触发 timeout 事件，不触发 reply 事件 */
    const timeoutCb2 = jest.fn();
    const replyCb2 = jest.fn();
    DP.listemWithinTime('jjj', 3 * 1000).timeout(timeoutCb2).reply(replyCb2);
    jest.runAllTimers();
    expect(timeoutCb2).toHaveBeenCalledTimes(1);
    expect(replyCb2).toHaveBeenCalledTimes(0);

    /** 单次事件 触发后将不在监听任何事件 */
    // await mockReport({ hhh: 666, jjj: 777 });
    // expect(replyCb).toHaveBeenCalledTimes(1);
    // expect(timeoutCb).toHaveBeenCalledTimes(0);
    // expect(timeoutCb2).toHaveBeenCalledTimes(1);
    // expect(replyCb2).toHaveBeenCalledTimes(0);
  })

  // test('监听 onChange 事件', async(done) => {
  //   expect.assertions(5);
  //   const onChangeCb = jest.fn(data => {
  //     expect(data.type).toBe('dpData');
  //   });

  //   const onChangeCb2 = jest.fn();

  //   DP.onChange(onChangeCb);
  //   DP.onChange(onChangeCb2);

  //   DP.mock({ hah: 666 });

  //   expect(onChangeCb).toHaveBeenCalledTimes(1);

  //   DP.mock({ hah: 666 });

  //   expect(onChangeCb).toHaveBeenCalledTimes(2);
  //   expect(onChangeCb2).toHaveBeenCalledTimes(2);
  //   done();
  // })
})