import { Dimensions, Platform } from 'react-native';
const { height, width } = Dimensions.get('window');

export const platform = Platform.OS;
export const widthDevice = width;
export const heightDevice = height;