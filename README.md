# DP 工具类

**设计目标**

- 简化 dp 监听操作，解耦每个 dp 监听逻辑，支持链式调用，优化代码结构，提升语义化
- 自动过滤设备无效上报，例如设备上电会上报一次同步 dp 数据，通过比较每个dp上报时间过滤无效上报
- dp 监听事件页面级管理，互不影响

```tsx
  const DP = DPUtil.createPageDp();

  // 监听 dp 上报 持续监听...直至销毁
  DP.listen(dpkey).reply((dpValue) => {
    ...
  })

  // 监听 16 进制字符串类型, 转为十进制
  DP.listen(dpKey).replyHexString((str) => {
    ...
  })

  // 监听多个 dp
  DP.listenDps([dpKey1, dpKey2])
    .reply(({ dpKey1: dpValue1, dpKey2: dpValue2 }) => {
      ...
    })

  // 在一定时间内监听 dp 上报, timeout 默认 10s 设备回复和倒计时结束都会销毁当前监听事件
  DP.listenWithinTime(dpkey, timeout)
    .reply((dpValue) => {
      ...
    })
    .timeout(() => {
      ...
    })

  // dp 主动下发 后监听
  DP.dispatch({ dpKey: dpValue }).listenWithinTime(dpkey, timeout)

  // 或者监听所有
  DP.onChange((data) => {
    ...
  })

  // 清空当前页面的 dp 监听事件，每个页面都调用DPUtil.createPageDp创建一个新的实例
  // 所以多个页面间不会相互影响
  DP.off();

  // 模拟 dp 上报，支持扩展参数, reply 方法可以获取到 (dpValue, ...args) => {}
  DP.mock(dps，waitTime, ...args);
```

- listen 应用场景

```tsx
  // 原来的监听逻辑
  TYSdk.event.on('deviceDataChange', (data: { payload?: any }, waitTime = 0) => {
    const {
      unlock_request: unlockRequest,
      alarm_request: alarmRequest,
      video_request_realtime: videoRequestRealtime,
    } = data?.payload;
    // 视频请求
    if (videoRequestRealtime) {
      const IPCCode = parseIPCDpCode(videoRequestRealtime);
      // console.log('IPCCode', IPCCode);
      ....
    }

    // 在主页是显示远程开门弹窗，非主页还要显示提示弹窗
    if (unlockRequest && canShowToastRef.current) {
      ....
    }

    if (alarmRequest && canShowToastRef.current) {
      // 显示劫持告警弹窗
      ....
      }
  })

  // 用 DP 工具类拆分每个 dp 独立的监听逻辑
  DP.listen('video_request_realtime').reply((dpValue, waitTime = 0) => {
    ...
  });

  DP.listen('unlock_request').reply(dpValue => {
    ...
  });

  DP.listen('alarm_request').reply(dpValue => {
    if (canShowToastRef.current) {
      ...
    }
  });
```

- **listenDps 应用场景**

监听开门和告警dp（多个dp）上报，更新主页记录

```tsx
  TYSdk.event.on('deviceDataChange', (data) => {
    let isChange = false;
      let alarmChange = false;
      _.forEach(data.payload, (val, key) => {
        if (openDoorDpCodes.indexOf(key) > -1 && !isChange) {
          isChange = true;
          setTimeout(() => {
            // 更新主页开门记录
            dispatch(
              actions.home.getRecordList({ devId, dpIds: openDoorDpIds, offset: 0, limit: 1 })
            );
          }, 500);
        }
        if (alarmDpCodes.indexOf(key) > -1 && !alarmChange) {
          alarmChange = true;
          setTimeout(() => {
            dispatch(actions.home.getLastAlarmRecord());
          }, 500);
        }
      });
  });
```

改用 DP

```tsx
  useEffect(() => {
    DP.listenDps(openDoorDpCodes).reply(() => {
      delayCall(() => {
        // 更新主页开门记录
        dispatch(actions.home.getRecordList({ devId, dpIds: openDoorDpIds, offset: 0, limit: 1 }));
      }, 500);
    });

    DP.listenDps(alarmDpCodes).reply(() => {
      delayCall(() => {
        dispatch(actions.home.getLastAlarmRecord());
      }, 500);
    });
  }, [])
```

- **listenWithinTime 应用场景**
    
    强制反锁按钮交互流程
    
    - 点击按钮下发 enforce_lock_up
    - 等待设备回复 reverse_lock 成功或者失败，如果不回复则进行超时处理

```tsx

// 对于下发超时处理这种业务场景需要用 setTimeOut 进行计时
let timeForceLockHandle: number;

// 点击事件中开始计时
const onEnforceLock = () => {
  TYSdk.mobile.hideLoading();
  TYSdk.device.putDeviceData({
    enforce_lock_up: true,
  });
  TYSdk.mobile.showLoading();
  clearTimeout(timeForceLockHandle);
  timeForceLockHandle = setTimeout(() => {
    TYSdk.mobile.hideLoading();
    setType('imagefail');
  }, 10000);
};

// 然后在 dpChange 事件里监听设备回复
TYSdk.event.on('deviceDataChange', (data) => {
	// 处理强制反锁结果
  if (reverseLock !== undefined) {
    TYSdk.mobile.hideLoading();
    if (reverseLock) {
      clearTimeout(timeForceLockHandle);
      setloading({
        ...loading,
        success: true,
        successtext: Strings.getLang('forceLocksuccess'),
      });
      setTimeout(() => {
        closeModal();
      }, 2000);
    } else {
      clearTimeout(timeForceLockHandle);
      setloading({
        ...loading,
        error: true,
        errortext: Strings.getLang('forceLockfail'),
      });
      setTimeout(() => {
        closeModal();
      }, 2000);
    }
  }
});

// 以上做法让代码结构非常的复杂，条理不清晰，代码容易失控
// 用 DP 工具可以实现链式调用，分步进行，结构清晰明了

const handleEnforceLock = () => {
  toastApi?.loading(Strings.getLang('forceLockLoading'));
  setEnforceBtnDisable(true);

  DP.dispatch({ enforce_lock_up: true })
    .listemWithinTime('reverse_lock', 10 * 1000)
    .reply(reverse => {
      if (reverse) {
        toastApi?.success(Strings.getLang('forceLocksuccess'));
        DP.dispatch({ remote_no_dp_key: '00' });
      } else {
        setEnforceBtnDisable(false);
        toastApi?.error(Strings.getLang('forceLockfail'));
      }

      delayCall(() => {
        modal.close();
      }, 2000);
    })
    .timeout(() => {
      setEnforceBtnDisable(false);
      toastApi?.error(Strings.getLang('forceLockfail'));
    });
};
```

以上的链式调用还有一种情况，a,b,c 三个面板，都有一个远程请求弹窗，a 面板如果点击开门按钮，设备回复一个开门结果，这时候在b、c面板也是要有对应的结果展示，所以这里的监听事件就要写在全局。

```tsx
  // 把 dp 的监听逻辑放在页面全局监听，下发之后监听超时事件
  useEffect(() => {
    DP.listen('remote_no_dp_key').reply((result) => {
      ....
    })
  }, [])

  const handleAgree = () => {
    DP.dispatch({ 'open_door': true }).listenWithinTime('remote_no_dp_key', 10*1000)
    .timeout(() => {
      ....
    })
  }
```

dispatch 目前是直接调用 TYSdk.device.putDeviceData 方法，

如果有独立的实现逻辑可以在外部实现

例如 远程开门请求的同意事件调 remoteOpenApi(true) 接口进行下发

```tsx
  useEffect(() => {
    DP.listen('remote_no_dp_key').reply((result) => {
      ....
    })
  }, [])

  const handleAgree = () => {
    // 调用接口之后监听超时事件就行了,就不要监听设备回复reply事件了
    remoteOpenApi(true);

    DP.listenWithinTime('remote_no_dp_key', 10*1000)
    .timeout(() => {
      ....
    })
  }
```

---

🙃需要注意的地方

- 这个工具设计初衷是希望写代码过程中简化 dp 交互操作，提升灵活性，但是灵活性高如果乱用也会出现不好维护的问题，大家在用的时候还是注意下集中管理监听事件；
- 如果出现两次监听同一个 dp 的情况，两个回调方法都会触发，如下，设备回复video_request_realtime 后 cb1 和 cb2都会触发，所以尽量不要重复监听。

```tsx
  DP.listen('video_request_realtime').reply(cb1);

  DP.listen('video_request_realtime').reply(cb2);

  // 集中管理
  useEffect(() => {
    DP.listen('video_request_realtime').reply((dpValue) => {
      ...
    });
    
    DP.listen('unlock_request').reply(dpValue => {
      ...
    });
    
    DP.listen('alarm_request').reply(dpValue => {
      if (canShowToastRef.current) {
        ...
      }
    });
}, [])
```