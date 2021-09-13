import { web, AwsCdkTypeScriptApp } from 'projen';

const testingLibrary = [
  "user-event",
  "react-hooks",
  "jest-dom",
  "react"
]

const deps = [
    "next-aws-lambda-webpack-plugin",
    "@axe-core/react",
    "next-images",
    "jest-extended",
    "@storybook/react",
    ...testingLibrary.map(dep => `@testing-library/${dep}`),
    "ts-jest",
    "@aws-amplify/auth",
    "@emotion/jest",
    "@emotion/styled",
    "@emotion/react",
    "@wojtekmaj/enzyme-adapter-react-17",
    "amazon-cognito-identity-js",
    "@types/testing-library__jest-dom",
    "jest-mock-extended",
    "jest-when",
    "fp-ts"
]

const depsWithoutTypes = [
  "react-helmet",
  "lodash",
  "ramda",
  "enzyme",
  "jest",
  "jest-when"
]

const tnmApp = new web.NextJsTypeScriptProject({
  defaultReleaseBranch: 'main',
  gitignore: [
    'out',
    '.DS_Store',
    'out_lambda',
    'build',
  ],
  name: 'tnm-v3',
  srcdir: 'src',
  projenrcTs: true,
  tsconfig: {
    include: ["src/global.d.ts"],
    exclude: [
      "build", "out_lambda", "next.config.js"
    ],
    compilerOptions: {
      isolatedModules: false
    }
  },
  jestOptions: {
    jestConfig: {
      setupFilesAfterEnv: ["<rootDir>/src/testSetup.ts"]
    }
  },
  devDeps: [...deps, ...depsWithoutTypes, ...depsWithoutTypes.map(dep => `@types/${dep}`)],
});

const infrastructure = new AwsCdkTypeScriptApp({
  name: 'tnm-v3-infrastructure',
  cdkVersion: '2.0.0-rc.21',
  outdir: 'infrastructure',
  defaultReleaseBranch: 'main',
  devDeps: ["fs-extra", "@types/fs-extra"],
  parent: tnmApp
})

infrastructure.tasks.removeTask('deploy')

const deploy = infrastructure.addTask("deploy:dev")
deploy.exec("yarn cdk deploy tnm-v3-dev-stack --outputs-file backend-config.json")
deploy.exec("aws s3 cp backend-config.json s3://$(cat backend-config.json | jq --raw-output 'keys[] as $k | .[$k] | .StaticsBucket')")

tnmApp.tsconfig.addExclude(infrastructure.outdir)

const tsConfig = tnmApp.tryFindObjectFile('tsconfig.json')

tsConfig.addOverride('compilerOptions.paths', { "@app/*": [ "*" ]})
tsConfig.addOverride('compilerOptions.baseUrl', "./src")

tnmApp.synth();
