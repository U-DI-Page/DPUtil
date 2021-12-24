/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-classes-per-file */
import has from 'lodash/has';
import {
  replyCb,
  timeoutCb,
  observerList,
  symbolDpKey,
  symbolTimer,
  lastReportTime,
  initObserver,
  checkHasCurrentDp,
} from './symbols';
import { ObserverFn, CbType, DpKeyType, ObjType, DpDataType } from './interface';
import { delayCall, getObserverLastDpTime } from './utils';
import ObserverMap from './observerMap';

interface IObserver<T extends DpKeyType> {
  reply: ObserverFn<Observer<T>, CbType<T>>;
  catch: (err: Error) => Observer<T>;
}

interface ITimeObserver<T extends DpKeyType> extends IObserver<T> {
  reply: ObserverFn<TimeObserver<T>, CbType<T>>;
  timeout: ObserverFn<Observer<T>, CbType<T>>;
}

export class Observer<T extends DpKeyType> implements IObserver<T> {
  static create<DS extends DpKeyType>(dpKey: DS): Observer<DS> {
    const ob = new Observer<DS>(dpKey);
    ob[replyCb] = () => {};
    ob[initObserver]();
    return ob;
  }

  constructor(dpKey: T) {
    this[symbolDpKey] = dpKey;
  }

  /** 私有属性 */
  [symbolTimer] = -1;

  [observerList]: ObserverMap<DpKeyType>;

  [symbolDpKey]: T;

  [lastReportTime]: number | ObjType;

  [replyCb]: CbType<T extends ObjType ? any : { [key: string]: any }>;

  [initObserver] = () => {
    getObserverLastDpTime(this[symbolDpKey]).then(dpsTime => {
      console.log('initobserver', dpsTime);
      this[lastReportTime] = dpsTime;
    });
  };

  [checkHasCurrentDp] = async (data: DpDataType, isMock: boolean) => {
    let dpKey = this[symbolDpKey];
    if (typeof dpKey !== 'string' && !Array.isArray(dpKey)) dpKey = dpKey.dpKey;

    if (
      (typeof dpKey === 'string' && has(data.payload, dpKey)) ||
      (dpKey instanceof Array && (dpKey as string[]).some(dp => has(data.payload, dp)))
    ) {
      const dpsTime = await getObserverLastDpTime(this[symbolDpKey]);
      console.log('current dpsTime', dpsTime);
      /** 如果最新的上报时间和上次的一样，则说明是设备缓存上报，忽略不计 */
      if (this[lastReportTime] === dpsTime && !isMock) {
        console.warn(`>>>>>---------Invalid Reported ${dpKey}------------<<<<<`);
        return false;
      }
      this[lastReportTime] = dpsTime;
      return true;
    }
    return false;
  };

  reply = (cb: CbType<T extends ObjType ? any : { [key: string]: any }>) => {
    this[replyCb] = cb;
    return this;
  };

  catch: (err: Error) => Observer<T>;
}

export class TimeObserver<T extends DpKeyType> extends Observer<T> implements ITimeObserver<T> {
  [timeoutCb]: CbType<T>;

  static createTimeObserver<DS extends DpKeyType>(dpKey: DS, timeout: number): TimeObserver<DS> {
    const TOB = new TimeObserver<DS>(dpKey);

    TOB[initObserver]();
    TOB[symbolTimer] = delayCall(() => {
      TOB[timeoutCb]();
      TOB[observerList].delete(dpKey);
    }, timeout);

    return TOB;
  }

  reply: (cb: CbType<T extends string ? any : { [key: string]: any }>) => this;

  timeout = (cb: CbType<T>) => {
    this[timeoutCb] = cb;
    return this;
  };
}
