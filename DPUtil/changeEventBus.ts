import { TYSdk } from 'tuya-panel-kit';

interface IChangeEventBus {
  listen: () => void;
  off: () => void;
  setEvent: (event: any) => void;
  isListening: () => boolean;
}

class ChangeEventBus implements IChangeEventBus {
  private hasListened = false;

  event: any;

  isListening = (): boolean => this.hasListened;

  setEvent = (event: any) => {
    this.event = event;

    this.listen();
  };

  listen = () => {
    this.hasListened = true;

    TYSdk.event.on('deviceDataChange', this.event);
  };

  off = (): void => {
    this.hasListened = false;

    TYSdk.event.off('deviceDataChange', this.event);
  };
}

export default new ChangeEventBus();
