# To Deploy

```bash
cdk deploy -f --require-approval never -c arn="arn:aws:apprunner:ap-northeast-1:123456789012:connection/cdk-connect/xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

# To Destroy

```bash
cdk destroy -f --require-approval never -c arn="arn:aws:apprunner:ap-northeast-1:123456789012:connection/cdk-connect/xxxxxxxxxxxxxxxxxxxxxxxxxx"
```