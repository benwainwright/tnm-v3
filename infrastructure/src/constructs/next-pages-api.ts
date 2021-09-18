import * as path from 'path';
import { Code, LayerVersion } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';

interface NextPagesApiProps {
  lambdaOutPath: string;
  nextDir: string;
}

export class NextPagesApi extends Construct {
  constructor(scope: Construct, id: string, props: NextPagesApiProps) {
    super(scope, id);

    new LayerVersion(this, 'aws-next-layer', {
      code: Code.fromAsset(path.resolve(props.lambdaOutPath, 'layer')),
    });
  }
}
