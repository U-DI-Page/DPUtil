import ChangeEventBus from './changeEventBus';
import { DpKeyType } from './interface';
import { Observer } from './observer';

type valueType<S> = S extends string
  ? Observer<string>
  : S extends string[]
  ? Observer<string[]>
  : Observer<symbol>;

export default class ObserverMap<S extends DpKeyType> extends Map<S, valueType<S>> {
  setT<SD extends S, O extends valueType<SD>>(key: SD, value: O): O {
    /** 如果没有监听事件，重新监听 */
    if (!ChangeEventBus.isListening) {
      ChangeEventBus.listen();
    }

    super.set(key, value);
    return value;
  }
}
