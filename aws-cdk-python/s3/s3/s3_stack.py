from aws_cdk import (
    core,
    aws_s3 as s3
)


class S3Stack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The code that defines your stack goes here
        # https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_core.PhysicalName.html
        # upload_bucket_name.value_as_string , core.PhysicalName.GENERATE_IF_NEEDED
        upload_bucket_name = core.CfnParameter(self, "uploadBucketName", type="String",
                                               description="The name of the Amazon S3 bucket where uploaded files will be stored.")
        bucket = s3.Bucket(self, "MyBucket", bucket_name=upload_bucket_name.value_as_string, versioned=True,
                           website_redirect=s3.RedirectTarget(host_name="www.youtube.com"), removal_policy=core.RemovalPolicy.DESTROY)
