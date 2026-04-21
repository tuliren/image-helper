const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');
const dotenv = require('dotenv');

const browser = process.env.BROWSER || 'chrome';
const env = dotenv.config({ path: '.env.production' }).parsed;
console.info('Env', JSON.stringify(env, null, 2));
console.info('Target browser', browser);
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: '.', to: '../', context: 'public/common' },
        { from: '.', to: '../', context: `public/${browser}/prod` },
      ],
      options: {},
    }),
    new DefinePlugin(envKeys),
  ],
});
