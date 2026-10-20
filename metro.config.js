const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Keep legacy package resolution for Expo Router compatibility. Modern packages
// such as @supabase/supabase-js and @radix-ui/react-slot publish their runtime
// entry as .mjs, so Metro must be able to resolve that extension.
config.resolver.unstable_enablePackageExports = false;

// expo-sqlite loads its wa-sqlite runtime as a .wasm asset on web.
if (!config.resolver.assetExts.includes('wasm')) {
    config.resolver.assetExts.push('wasm');
}

module.exports = withNativeWind(config, { input: './global.css' });
