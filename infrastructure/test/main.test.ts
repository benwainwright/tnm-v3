import '@aws-cdk/assert/jest';
import { App } from 'aws-cdk-lib';
import {TnmV3Stack } from '../src/main';

test('Snapshot', () => {

const env = {
  account: "568693217207",
  region: "eu-west-2",
};

  const app = new App();
  new TnmV3Stack(app, 'test', { envName: 'test', stackProps: { env } });
});
