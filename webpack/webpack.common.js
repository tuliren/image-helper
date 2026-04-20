const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const browser = process.env.BROWSER || 'chrome';

if (browser !== 'chrome' && browser !== 'firefox') {
  throw new Error(`Unsupported BROWSER "${browser}"; expected "chrome" or "firefox"`);
}

module.exports = {
  entry: {
    options: path.join(srcDir, 'options.tsx'),
    background: path.join(srcDir, 'background.ts'),
    content_script: path.join(srcDir, 'content_script.ts'),
  },
  output: {
    path: path.join(__dirname, '..', 'dist', browser, 'js'),
    filename: '[name].js',
  },
  optimization: {
    splitChunks: {
      name: 'vendor',
      chunks(chunk) {
        return chunk.name === 'options';
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        resourceQuery: /raw/,
        type: 'asset/source',
        use: ['postcss-loader'],
      },
      {
        test: /\.css$/i,
        resourceQuery: { not: [/raw/] },
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
};
