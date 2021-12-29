import { TYSdk } from 'tuya-panel-kit';
import { Observer, TimeObserver } from './observer';
import ChangeEventBus from './changeEventBus';
import ObserverMap from './observerMap';
import { replyCb, checkHasCurrentDp, symbolTimer } from './symbols';
import { dpKeyWrap } from './utils';
import {
  DpDataType,
  ObjType,
  IDP,
  IObserver,
  ITimeObserver,
  DpKeyType,
  CbWithDPValue,
} from './interface';

class DPUtil implements IDP {
  private observerList: ObserverMap<DpKeyType<string>, IObserver<DpKeyType<string>>>;
  private onChangeList: ObserverMap<DpKeyType<string>, (data: DpDataType) => void>;

  static createPageDp = () => {
    return new DPUtil();
  };

  constructor() {
    this.observerList = new ObserverMap();
    this.onChangeList = new ObserverMap();

    ChangeEventBus.setEvent(this.dpDataChangeHandle);
  }

  private dpDataChangeHandle = (data: DpDataType, isMock = false, ...args: any[]) => {
    try{
      /** 透传 change 事件 */
      if(this.onChangeList.size > 0){
        this.onChangeList.forEach((cb) => {
          typeof cb === 'function' && cb(data);
        });
      }

      if (data.type !== 'dpData') return;
      if (data.payload) {
        this.observerList.forEach(async (ob, dpKey) => {
          const pass = await ob[checkHasCurrentDp](data, isMock);
          if (pass) {
            let dpValues: any;
  
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
    } catch (e){
      console.log('error', e);
    }
  };

  listen = (dpKey: string) => {
    const symbolDpKey = dpKeyWrap(dpKey);
    const ob = Observer.create<symbol>(symbolDpKey, this.observerList);
  
    return this.observerList.setT<symbol, IObserver<symbol>>(symbolDpKey, ob);
  };

  listemWithinTime = (dpKey: string, timeout = 10 * 1000) => {
    const symbolDpKey = dpKeyWrap(dpKey);
    const tob = TimeObserver.createTimeObserver<symbol>(symbolDpKey, timeout, this.observerList);

    return this.observerList.setT<symbol, ITimeObserver<symbol>>(symbolDpKey, tob);
  };

  listenDps = (dps: string[]) => {
    const ob = Observer.create<string[]>(dps, this.observerList);
    return this.observerList.setT<string[], IObserver<string[]>>(dps as string[], ob);
  };

  mock = (dps: { [key: string]: any }, ...args: any[]) => {
    this.dpDataChangeHandle({ type: 'dpData', payload: dps }, true, ...args);
  };

  dispatch = (dps: ObjType) => {
    TYSdk.device.putDeviceData(dps);
    return this;
  };

  onChange = (cb: CbWithDPValue<DpDataType>) => {
    this.onChangeList.setT(dpKeyWrap('onChange'), cb);
  };

  off = () => {
    this.observerList.clear();
    this.onChangeList.clear();
  };
}

export default DPUtil;
