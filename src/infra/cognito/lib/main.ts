import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { CognitoStack } from "./cognito";
import { IamStack } from "./iam";

export class SecurityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const region = cdk.Aws.REGION;

    const app = new cdk.App();

   /*  const iamStack: IamStack = new IamStack(app, "iamStack", {
      env: { region: region },
    }); */


    


/* 
    const cognitoStack: CognitoStack = new CognitoStack(app, "congnitoStack", {
      env: { region: region },
    });
 */
   // cognitoStack.addDependency(iamStack);

  
  }
}
