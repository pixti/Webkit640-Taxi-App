import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import TaxiApp from './src/TaxiApp';
import { name as appName } from './app.json';
import 'react-native-get-random-values';

AppRegistry.registerComponent(appName, () => TaxiApp);