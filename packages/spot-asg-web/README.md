# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Instance npm package.
```bash
npm i
```

### To deploy
```bash
# Please replace to yours.
export ACM=arn:aws:acm:ap-northeast-1:123456789012:certificate/xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxx
export ZONEID=Z012345678987654A612
export ZONENAME=example.com

cdk deploy -c acm=$ACM -c zoneId=$ZONEID -c zoneName=$ZONENAME
```
### To destroy
```bash
cdk destroy
```