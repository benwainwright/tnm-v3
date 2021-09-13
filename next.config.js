const GenerateAwsLambda = require('next-aws-lambda-webpack-plugin');
const withImages = require('next-images')

module.exports = withImages({
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],
  target: 'serverless',
  webpack: (config, nextConfig) => {
      config.plugins.push(new GenerateAwsLambda(nextConfig));
      if(!nextConfig.isServer) {
        config.resolve.fallback.fs = false;
      }
      return config
  },
  images: {
    disableStaticImages: true,
    loader: 'custom'
  }
});

