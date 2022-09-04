#!/bin/sh

sed -i 's/@aws-cdk/aws-cdk-lib/g' $1
sed -i 's/cdk.Construct/Construct/g' $1


# for files in "LICENSE"
# do 
#     find ./packages -name $files -exec rm -rf {} \;
# done 

find ./packages/ -name "*.ts" -type f | xargs -n 1 sed -i 's/@aws-cdk/aws-cdk-lib/g'
find ./packages/ -name "*.ts" -type f | xargs -n 1 sed -i 's/cdk.Construct/Construct/g'
find ./packages/ -name "*.ts" -type f | xargs -n 1 sed -i 's#aws-cdk-lib/core#aws-cdk-lib#g'