import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { defineFunction } from "@aws-amplify/backend";
import { DockerImage, Duration } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
const functionDir = path.dirname(fileURLToPath(import.meta.url));

export const predictHandler = defineFunction(
  (scope) => {
    
    const fn = new Function(scope, "predict", {
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
        actions: ["sagemaker:InvokeEndpoint"],
        resources: [
          "arn:aws:sagemaker:eu-west-1:661920085301:endpoint/pytorch-inference-2025-06-08-21-35-04-504",
        ],
      })
    );

    return fn;
  },
    {
      resourceGroupName: "auth"
    }
);
