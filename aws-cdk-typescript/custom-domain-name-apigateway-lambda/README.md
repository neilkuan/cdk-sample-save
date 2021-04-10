## Install package
```bash
yarn
```

## To diff
```bash
cdk diff -c rootdomain=example.com -c hostedZoneId=ZXXXXXXXXXXXXX
```
## To deploy
```bash
cdk deploy -c rootdomain=example.com -c hostedZoneId=ZXXXXXXXXXXXXX
```

## To destroy
```bash
cdk destroy
```