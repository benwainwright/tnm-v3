import { web, AwsCdkTypeScriptApp } from 'projen';

const tnmApp = new web.NextJsTypeScriptProject({
  defaultReleaseBranch: 'main',
  gitignore: [
    'out_lambda',
    'build',
  ],
  name: 'tnm-v3',
  projenrcTs: true,
  devDeps: ["next-aws-lambda-webpack-plugin"],
});

const infrastructure = new AwsCdkTypeScriptApp({
  name: 'tnm-v3-infrastructure',
  cdkVersion: '2.0.0-rc.21',
  outdir: 'infrastructure',
  defaultReleaseBranch: 'main',
  devDeps: ["fs-extra", "@types/fs-extra"],
  parent: tnmApp
})

tnmApp.tsconfig.addExclude(infrastructure.outdir)

tnmApp.synth();
