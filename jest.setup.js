import { NativeModules } from 'react-native';
import 'react-native-mock-render/mock';
import 'react-native/Libraries/Animated/src/bezier'; // for https://github.com/facebook/jest/issues/4710

NativeModules.RNGestureHandlerModule = {};
NativeModules.TYRCTPublicModule = {};
NativeModules.TYRCTDeviceModule = {};
NativeModules.TYRCTPublicManager = {};
NativeModules.TYRCTPanelManager = {};

global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}