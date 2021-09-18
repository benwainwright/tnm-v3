import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { haveResourceLike, expect as cdkExpect } from '@aws-cdk/assert';
import { App, Stack } from '@aws-cdk/core';
import { vol } from '../test-support';
import { NextPagesApi } from './next-pages-api';

jest.mock('fs');
jest.mock('fs/promises');

describe('the next pages api construct', () => {

  beforeEach(async () => {
    await fs.mkdir(os.tmpdir(), { recursive: true });
  });

  afterEach(async () => {
    vol.reset();
  });

  it('creates a lambda layer', async () => {
    const outPath = path.resolve(process.cwd(), 'foo');
    const layerDir = path.resolve(outPath, 'layer');

    await fs.mkdir(layerDir, { recursive: true });

    await fs.writeFile(path.resolve(layerDir, 'file-1'), 'something');
    await fs.writeFile(path.resolve(layerDir, 'file-2'), 'something');

    const app = new App();
    const stackName = 'my-stack';
    const stack = new Stack(app, stackName);

    new NextPagesApi(stack, 'api', { lambdaOutPath: outPath, nextDir: 'foo'});

    cdkExpect(stack).to(haveResourceLike('AWS::Lambda::LayerVersion'));
  });
});
