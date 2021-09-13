const GenerateAwsLambda = require('next-aws-lambda-webpack-plugin');
const withImages = require('next-images')

module.exports = withImages({
    target: 'serverless',
    webpack: (config, nextConfig) => {
        config.plugins.push(new GenerateAwsLambda(nextConfig));
        return config
    },
  images: {
    disableStaticImages: true,
    loader: 'custom'
  }
});

