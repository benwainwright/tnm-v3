import '@aws-cdk/assert/jest';
import { App } from 'aws-cdk-lib';
import {TnmV3Stack } from '../src/main';

test('Snapshot', () => {
  const app = new App();
  new TnmV3Stack(app, 'test');
});
