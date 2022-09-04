# Create VPNClientEndPoint via AWSCDK

AWSCDK Version: 1.86.0 
AWS_DEFAULT_REGION: ap-northeast-1

```bash
cd packages/vpnclient
git clone https://github.com/OpenVPN/easy-rsa.git
cd easy-rsa/easyrsa3
cd easyrsa3/
./easyrsa init-pki
./easyrsa build-ca nopass
./easyrsa build-server-full server nopass
./easyrsa build-client-full client1.domain.tld nopass
mkdir aws-client-vpn/
cp pki/ca.crt aws-client-vpn/
cp pki/issued/server.crt aws-client-vpn/
cp pki/private/server.key aws-client-vpn/
cp pki/issued/client1.domain.tld.crt aws-client-vpn/
cp pki/private/client1.domain.tld.key aws-client-vpn/
cd aws-client-vpn/
ls

# import server ca to ACM, and keep arn, it will been used in cdk stack later
aws acm import-certificate --certificate fileb://server.crt --private-key fileb://server.key --certificate-chain fileb://ca.crt --region ap-northeast-1 --tags Key=Name,Value=server

# or you can export arn to ENVAR first
export SERVER_ARN=arn:aws:acm:ap-northeast-1:123456789012:certificate/xxxxxx-1111-2222-3333-xxxxxxxxxx
# import client ca to ACM, and keep arn, it will been used in cdk stack later
aws acm import-certificate --certificate fileb://client1.domain.tld.crt --private-key fileb://client1.domain.tld.key --certificate-chain fileb://ca.crt --region ap-northeast-1 --tags Key=Name,Value=client

# or you can export arn to ENVAR first
export CLIENT_ARN=arn:aws:acm:ap-northeast-1:123456789012:certificate/xxxxxx-1111-2222-3333-xxxxxxxxxx

cd ../..
cdk ls

cdk diff -c CLIENT_ARN=$CLIENT_ARN -c SERVER_ARN=$SERVER_ARN
cdk deploy --all -c CLIENT_ARN=$CLIENT_ARN -c SERVER_ARN=$SERVER_ARN
```

### waiting for Clinet Vpn endpoint pending-associate to Associated, then download *.ovpn file
```bash
aws ec2 export-client-vpn-client-configuration --client-vpn-endpoint-id ${vpnClentEndPointId} --output text>vpn-client.ovpn
ls

code vpn-client.ovpn
code easy-rsa/easyrsa3/aws-client-vpn/client1.domain.tld.crt 
code easy-rsa/easyrsa3/aws-client-vpn/client1.domain.tld.key 
```
### Edit file modify 
`vpn-client.ovpn`
- `remote <your-client-vpn-endpoint-domain>` like `hello.cvpn-endpoint-xxxxxxxxxxxx.prod.clientvpn.ap-northeast-1.amazonaws.com`
- copy and paste `<your-client-cert>` and `<your-client-key>`
```bash
client
dev tun
proto udp
remote <your-client-vpn-endpoint-domain> 443
remote-random-hostname
resolv-retry infinite
nobind
remote-cert-tls server
cipher AES-256-GCM
verb 3

<ca>
...
</ca>

<cert>
... <your-client-cert>
</cert>

<key>
... <your-client-key>
</key>
```