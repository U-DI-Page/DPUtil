import { NativeModules } from 'react-native';
import { TYSdk } from 'tuya-panel-kit';
import { DpKeyType, ObjType } from './interface';

/**
 * 获取 dp 上次上报的时间
 * @param code dpCode
 * @returns
 */
export const getLastDpTime = (code: string): Promise<number> =>
  new Promise((resolve, reject) => {
    try {
      NativeModules.TYRCTPanelDeviceManager.getDpsTimeWithDevId(
        TYSdk.devInfo.devId,
        [TYSdk.device.getDpIdByCode(code)],
        (success: any) => {
          resolve(success[TYSdk.device.getDpIdByCode(code)]);
        }
      );
    } catch (e) {
      reject(e);
    }
  });

// export const type = (obj: any) => {
//   return Object.prototype.toString.call(obj).match(/\[object (.*)\]/)[1];
// };

/**
 * 获取一个 Observer 中 监听的 dp 上次上报的时间
 */
export const getObserverLastDpTime = async (dpKey: any) => {
  if (Array.isArray(dpKey)) {
    const times = await Promise.all(dpKey.map(dp => () => getLastDpTime(dp)));
    return dpKey.reduce((dpsTime, dp, index) => {
      dpsTime[dp] = times[index];
      return dpsTime;
    }, {} as ObjType);
  }
  if (typeof dpKey === 'string') {
    const time = await getLastDpTime(dpKey);
    return time;
  }
  const time = await getLastDpTime(dpKey.description);
  return time;
};

// 延时调用
export const delayCall = (cb: () => void, delay = 3000): ReturnType<typeof setTimeout> => {
  const timer = setTimeout(() => {
    cb && cb();
    clearTimeout(timer);
  }, delay);

  return timer;
};

export const dpKeyWrap = (dpKey: string) => Symbol(dpKey);
