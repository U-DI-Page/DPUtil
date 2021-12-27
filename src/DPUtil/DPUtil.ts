import { TYSdk } from 'tuya-panel-kit';
import { Observer, TimeObserver } from './observer';
import ChangeEventBus from './changeEventBus';
import ObserverMap from './observerMap';
import { replyCb, observerList, checkHasCurrentDp, symbolTimer } from './symbols';
import { dpKeyWrap } from './utils';
import {
  DpsType,
  Fn,
  DpDataType,
  DpListenType,
  TimeoutListenerType,
  ListenDpsType,
  DpKeyType,
  ObjType,
} from './interface';

interface IDP {
  listen: DpListenType<Observer<DpKeyType>>;
  listemWithinTime: TimeoutListenerType<Observer<DpKeyType>>;
  listenDps: ListenDpsType<Observer<DpKeyType>>;
  dispatch: DpsType;
  off: Fn;
  mock: (dps: { [key: string]: any }, ...args: any[]) => void;
  // unListen: (dpKey: DpKeyType) => void;
}

class DPUtil implements IDP {
  private observerList: ObserverMap<DpKeyType>;

  static createPageDp = () => {
    return new DPUtil();
  };

  constructor() {
    this.observerList = new ObserverMap();

    ChangeEventBus.setEvent(this.dpDataChangeHandle);
  }

  private dpDataChangeHandle = (data: DpDataType, isMock = false, ...args: any[]) => {
    if (data.type !== 'dpData') return;
    if (data.payload) {
      this.observerList.forEach(async (ob, dpKey) => {
        const pass = await ob[checkHasCurrentDp](data, isMock);

        if (pass) {
          let dpValues;
          if (typeof dpKey === 'string') {
            dpValues = data.payload[dpKey];
          } else if (Array.isArray(dpKey)) {
            dpValues = dpKey.reduce((ans, dp) => {
              // eslint-disable-next-line no-param-reassign
              ans[dp] = data.payload[dp];
              return ans;
            }, {} as ObjType);
          } else if(typeof dpKey === 'symbol') {
            dpValues = data.payload[dpKey.description];
          }

          typeof ob[replyCb] === 'function' && ob[replyCb](dpValues, ...args);
          /** 设备答复 去掉超时监听 */
          if (ob[symbolTimer] !== -1) {
            clearTimeout(ob[symbolTimer]);
            this.observerList.delete(dpKey);
          }
        }
      });
    }
  };

  listen = (dpKey: string) => {
    const symbolDpKey = dpKeyWrap(dpKey);
    const ob = Observer.create<symbol>(symbolDpKey);
    return this.observerList.setT<symbol, Observer<symbol>>(symbolDpKey, ob);
  };

  listemWithinTime = (dpKey: string, timeout = 10 * 1000) => {
    const symbolDpKey = dpKeyWrap(dpKey);
    const tob = TimeObserver.createTimeObserver<symbol>(symbolDpKey, timeout);
    tob[observerList] = this.observerList;
    return this.observerList.setT<symbol, TimeObserver<symbol>>(symbolDpKey, tob);
  };

  listenDps = (dps: string[]) => {
    const ob = Observer.create<string[]>(dps);
    return this.observerList.setT<string[], Observer<string[]>>(dps, ob);
  };

  mock = (dps: { [key: string]: any }, ...args: any[]) => {
    this.dpDataChangeHandle({ type: 'dpData', payload: dps }, true, ...args);
  };

  dispatch = (dps: ObjType) => {
    TYSdk.device.putDeviceData(dps);
    return this;
  };

  // unListen = (dpKey: DpKeyType) => {
  //   if (typeof dpKey === 'string') {
  //     this.observerList.delete(dpKey);
  //   }
  // };

  off = () => {
    this.observerList.clear();
  };
}

export default DPUtil;
