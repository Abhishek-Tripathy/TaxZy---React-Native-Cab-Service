const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// config.resolver.extraNodeModules = {
//   ...config.resolver.extraNodeModules,
//   "react-native/Libraries/Utilities/codegenNativeCommands": require.resolve(
//     "react-native/Libraries/Utilities/codegenNativeCommands"
//   ),
// };

config.resolver.platforms = ['native', 'android', 'ios'];

module.exports = withNativeWind(config, { input: "./global.css" });
