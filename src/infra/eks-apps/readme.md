# Deploy CDK8 App to Kubernetes Cluster

```bash
export SIMPLE_API_CONTAINER_IMG=$(aws cloudformation describe-stacks  --stack-name demo-dotnet-cognito-ecr-img --output text --query 'Stacks[0].Outputs[?OutputKey==`imageUri`].OutputValue  | [0]')
```
