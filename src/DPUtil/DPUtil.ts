import { TYSdk } from 'tuya-panel-kit';
import { Observer, TimeObserver } from './observer';
import ChangeEventBus from './changeEventBus';
import ObserverMap from './observerMap';
import { replyCb, checkHasCurrentDp, symbolTimer } from './symbols';
import { dpKeyWrap, asyncDispatchEachObserverLit } from './utils';
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

  private dpDataChangeHandle = async(data: DpDataType, isMock = false, ...args: any[]) => {
    /** 透传 change 事件 */
    if(this.onChangeList.size > 0){
      this.onChangeList.forEach((cb) => {
        typeof cb === 'function' && cb(data);
      });
    }

    if (data.type !== 'dpData') return;
    if (data.payload) {
      await asyncDispatchEachObserverLit(this.observerList, data, isMock, args);
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
