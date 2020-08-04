import setuptools


with open("README.md") as fp:
    long_description = fp.read()


setuptools.setup(
    name="ecs_alb",
    version="0.0.1",

    description="An empty CDK Python app",
    long_description=long_description,
    long_description_content_type="text/markdown",

    author="author",

    package_dir={"": "ecs_alb"},
    packages=setuptools.find_packages(where="ecs_alb"),

    install_requires=[
        "aws-cdk.core==1.32.1",
        "aws-cdk.aws-ec2",
        "aws-cdk.aws-ecs",
        "aws-cdk.aws-iam",
        "aws-cdk.aws-route53",
        "aws-cdk.aws-ecr",
        "aws-cdk.aws_autoscaling",
        "aws-cdk.aws-autoscaling-common",
        "aws-cdk.aws_ecs_patterns",
        "aws-cdk.aws-route53-targets",
        "aws-cdk.aws-certificatemanager",
        "aws-cdk.aws-s3","aws-cdk.aws-dynamodb"        
    ],

    python_requires=">=3.6",

    classifiers=[
        "Development Status :: 4 - Beta",

        "Intended Audience :: Developers",

        "License :: OSI Approved :: Apache Software License",

        "Programming Language :: JavaScript",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",

        "Topic :: Software Development :: Code Generators",
        "Topic :: Utilities",

        "Typing :: Typed",
    ],
)
