const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Desactivar package exports modernos para evitar que dependencias tipo lru-cache/ESM
// metan propiedades privadas (#private) incompatibles con Hermes
config.resolver.unstable_enablePackageExports = false;

// Filtrar extensiones .mjs para obligar a Metro a usar las distribuciones CJS compatibles
config.resolver.sourceExts = config.resolver.sourceExts.filter(
    (ext) => ext !== 'mjs'
);

module.exports = withNativeWind(config, { input: './global.css' });