import ChangeEventBus from './changeEventBus';
import { IObserver } from './interface';


export default class ObserverMap<S extends any, V extends any> extends Map<S, V> {
  setT<SD extends S, O extends V>(key: SD, value: O): O {
    /** 如果没有监听事件，重新监听 */
    if (!ChangeEventBus.isListening) {
      ChangeEventBus.listen();
    }

    super.set(key, value);
    return value;
  }
}
