/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import Router from './src/Router';
console.disableYellowBox = true;

AppRegistry.registerComponent(appName, () => Router);
