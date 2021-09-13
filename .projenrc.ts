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

const deps = [
    "next-aws-lambda-webpack-plugin",
    "axios",
    "jest-enzyme",
    "jest-transform-stub",
    "@axe-core/react",
    "next-images",
    "jest-extended",
    "@storybook/react",
    ...testingLibrary.map(dep => `@testing-library/${dep}`),
    ...emotion.map(dep => `@emotion/${dep}`),
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
    "@babel/core",
    "@cypress/code-coverage"
]

const depsWithoutTypes = [
  "jsonwebtoken",
  "jwk-to-pem",
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
  jest: true,
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
}

const cypressOpen = tnmApp.addTask("test:cypress:open")

addCypressEnvVars(cypressOpen)

cypressOpen.exec("yarn cypress open")


tnmApp.synth();
