export type Fn = () => void;
export type CbType<T> = (dpValue?: T, ...args: any[]) => void;
export type ObserverFn<T, C> = (cb: C) => T;

export type DPFn<T> = (dpValue: any) => T;
export type DpListenType<T> = (dpKey: string) => T;
export type ListenDpsType<T> = (dps: string[]) => T;
export type TimeoutListenerType<T> = (dpKey: string, timeout: number) => T;
export type DpDataType = { payload: { [key: string]: any }; type: 'dpData' | 'devInfo' };
export type DpsType = (dps: ObjType) => void;

export type DpKeyType = string | string[] | ObjType;
export type ObjType = { [key: string]: any };
