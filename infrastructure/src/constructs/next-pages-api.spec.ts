import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { haveResourceLike, expect as cdkExpect, Capture } from '@aws-cdk/assert';
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

  it('creates a lambda layer from the contents of the layer folder', async () => {
    const outPath = path.resolve(process.cwd(), 'foo');
    const layerDir = path.resolve(outPath, 'layer');

    await fs.mkdir(layerDir, { recursive: true });

    await fs.writeFile(path.resolve(layerDir, 'file-1'), 'something');
    await fs.writeFile(path.resolve(layerDir, 'file-2'), 'something');

    const app = new App();
    const stackName = 'my-stack';
    const stack = new Stack(app, stackName);

    new NextPagesApi(stack, 'api', { lambdaOutPath: outPath });

    const bucketName = Capture.aString();
    const S3Key = Capture.aString();

    cdkExpect(stack).to(haveResourceLike('AWS::Lambda::LayerVersion', {
      Content: {
        S3Bucket: {
          'Fn::Sub': bucketName.capture(),
        },
        S3Key: S3Key.capture(),
      },
    }));

    const assetsManifest = `${app.assetOutdir}/${stackName}.assets.json`;

    const { files } = JSON.parse(await fs.readFile(assetsManifest, 'utf8'));

    const file = files[S3Key.capturedValue.split('.')[0]];
    const assetDir = path.resolve(app.assetOutdir, file.source.path)

    const filesInAssetDir = await fs.readdir(assetDir)

    expect(filesInAssetDir).toEqual(expect.arrayContaining(['file-1', 'file-2']))
    expect(file.destinations['current_account-current_region'].bucketName).toEqual(bucketName.capturedValue);
  });


});
