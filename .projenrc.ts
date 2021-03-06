import { web, AwsCdkTypeScriptApp } from 'projen';
import { Task } from 'projen/lib/tasks';

const testingLibrary = [
  "user-event",
  "react-hooks",
  "jest-dom",
  "react"
]

const emotion = [
  "jest",
  "styled",
  "react",
  "babel-plugin"
]

const storybook = [
  "builder-webpack5",
  "manager-webpack5",
  "cli",
  "addon-a11y",
  "addon-actions",
  "addon-essentials",
  "addon-links",
  "react",
]

const deps = [
    "next-aws-lambda-webpack-plugin",
    "axios",
    "webpack",
    "@svgr/webpack",
    "babel-plugin-module-resolver",
    "esbuild",
    "reflect-metadata",
    "inversify",
    "jest-enzyme",
    "jest-transform-stub",
    "@babel/plugin-proposal-decorators",
    "@axe-core/react",
    "@storybook/builder-webpack5",
    "next-images",
    "jest-extended",
    "@storybook/react",
    ...testingLibrary.map(dep => `@testing-library/${dep}`),
    ...emotion.map(dep => `@emotion/${dep}`),
    ...storybook.map(dep => `@storybook/${dep}`),
    "ts-jest",
    "@aws-amplify/auth",
    "@wojtekmaj/enzyme-adapter-react-17",
    "amazon-cognito-identity-js",
    "@types/testing-library__jest-dom",
    "jest-mock-extended",
    "jest-when",
    "fp-ts",
    "cypress",
    "aws-sdk",
    "aws-sdk-mock",
    "@babel/core",
    "tslog",
    "@cypress/code-coverage",
    "babel-preset-react-app"
]

const depsWithoutTypes = [
  "jsonwebtoken",
  "jwk-to-pem",
  "aws-lambda",
  "pluralize",
  "uuid",
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
    'storybook',
    'out',
    '.DS_Store',
    'out_lambda',
    'build',
  ],
  name: 'tnm-v3',
  srcdir: 'src',
  tailwind: false,
  compileBeforeTest: false,
  jest: true,
  projenrcTs: true,
  tsconfig: {
    include: ["src/global.d.ts"],
    exclude: [
      "build", "out_lambda", "next.config.js"
    ],
    compilerOptions: {
      lib: ["es2019", "dom"],
      isolatedModules: false
    }
  },
  jestOptions: {
    jestConfig: {
      testEnvironment: "jsdom",
      setupFiles: [`<rootDir>/config/loadershim.js`],
      moduleNameMapper: {
        "^@app(.*)$": "<rootDir>/src$1"
      },
      testPathIgnorePatterns: [
        `node_modules`,
        `\\.cache`,
        `<rootDir>.*/public`,
        `cypress`
      ],
      transform: {
        "^.+\\.(svg|css|png)$": "jest-transform-stub",
        "^.+\\.[jt]sx?$": "<rootDir>/config/jest-preprocess.js"
      },
      setupFilesAfterEnv: ["<rootDir>/src/testSetup.ts"]
    }
  },
  deps: [
    ...deps,
    ...depsWithoutTypes,
    ...depsWithoutTypes.map(dep => `@types/${dep}`)
  ],
});

const cdk = [
  "s3",
  "s3-deployment",
  "cloudfront",
  "cloudfront-origins",
  "cognito",
  "apigateway",
  "lambda",
  "certificatemanager",
  "route53",
  "route53-targets",
  "s3",
  "s3-deployment",
  "dynamodb",
  "appsync"
]

const infrastructure = new AwsCdkTypeScriptApp({
  name: 'tnm-v3-infrastructure',
  cdkVersion: '1.123.0',
  context: {
    "@aws-cdk/core:newStyleStackSynthesis": "true"
  },
  minNodeVersion: "14.17.6",
  outdir: 'infrastructure',
  defaultReleaseBranch: 'main',
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true
    }
  },
  devDeps: [
    ...cdk.map(dep => `@aws-cdk/aws-${dep}`),
    "@aws-cdk/core",
    'aws-cdk',
    "aws-cdk-local",
    "fs-extra",
    "@types/fs-extra",
    "@types/node",
    "memfs",
    "extract-zip",
  ],
  parent: tnmApp,
});

const infrastructureJestTsconfig = infrastructure.tryFindObjectFile('tsconfig.jest.json')
infrastructureJestTsconfig.addOverride('compilerOptions.typeRoots', [ "./node_modules/@types" ])

infrastructure.tasks.removeTask('deploy')

const deploy = infrastructure.addTask("deploy:dev")
deploy.exec("yarn cdk deploy tnm-v3-dev-stack --outputs-file backend-config.json")
deploy.exec("aws s3 cp backend-config.json s3://$(cat backend-config.json | jq --raw-output 'keys[] as $k | .[$k] | .StaticsBucket')")

tnmApp.tsconfig.addExclude(infrastructure.outdir)

const tsConfig = tnmApp.tryFindObjectFile('tsconfig.json')

tsConfig.addOverride('compilerOptions.paths', { "@app/*": [ "*" ]})
tsConfig.addOverride('compilerOptions.baseUrl', "./src")
tsConfig.addOverride('compilerOptions.useUnknownInCatchVariables', true)

const tsConfigJest = tnmApp.tryFindObjectFile('tsconfig.jest.json')

tsConfigJest.addOverride('compilerOptions.paths', { "@app/*": [ "*" ]})
tsConfigJest.addOverride('compilerOptions.baseUrl', "./src")

const addCypressEnvVars = (task: Task) => {
  task.env("CYPRESS_TEST_REGISTER_USER", "test-user-1")
  task.env("CYPRESS_TEST_EMAIL", "a@b.com")
  task.env("CYPRESS_TEST_USER_INITIAL_PASSWORD", "123.123Aa")
  task.env("CYPRESS_INT_TEST_EMAIL", "a1@b1.com")
  task.env("CYPRESS_INT_TEST_PASSWORD", "123.123Aa")
  task.env("CYPRESS_INT_TEST_PASSWORD", "123.123Aa")
  return task
}

tnmApp.addTask("storybook")
      .exec('start-storybook --static-dir ./src/assets')

tnmApp.addTask("storybook:build")
      .exec('build-storybook --static-dir ./src/assets --output-dir ./storybook')

addCypressEnvVars(tnmApp.addTask("test:cypress:open"))
                        .exec("yarn cypress open")

tnmApp.synth();
