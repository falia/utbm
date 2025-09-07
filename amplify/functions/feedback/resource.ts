import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { defineFunction } from "@aws-amplify/backend";
import { DockerImage, Duration } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

const functionDir = path.dirname(fileURLToPath(import.meta.url));

export const feedbackHandler = defineFunction(
  (scope) => {

    const fn = new Function(scope, "feedback", {
      handler: "index.handler",
      runtime: Runtime.PYTHON_3_13,
      timeout: Duration.seconds(180),
      code: Code.fromAsset(functionDir, {
        bundling: {
          image: DockerImage.fromRegistry("aws/codebuild/amazonlinux-x86_64-standard:5.0"),
          local: {
            tryBundle(outputDir: string) {
              execSync(
                `python3 -m pip install -r ${path.join(functionDir, "requirements.txt")} -t ${path.join(outputDir)} --platform manylinux2014_x86_64 --only-binary=:all:`
              );
              execSync(`cp -r ${functionDir}/* ${path.join(outputDir)}`);
              return true;
            },
          },
        },
      }),
    });

    fn.addToRolePolicy(
      new PolicyStatement({
        actions: [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        resources: ["*"], // Will be restricted to specific table in backend.ts
      })
    );

    return fn;
  },
  {
    resourceGroupName: "feedback"
  }
);