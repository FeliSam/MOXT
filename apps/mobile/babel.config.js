module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // lucide-direct : une icône par import, pas le baril de 3500 modules.
    plugins: ['./babel-plugin-lucide-direct'],
  };
};
