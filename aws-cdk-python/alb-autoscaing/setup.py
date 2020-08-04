import setuptools


with open("README.md") as fp:
    long_description = fp.read()


setuptools.setup(
    name="alb_autoscaing",
    version="0.0.1",

    description="An empty CDK Python app",
    long_description=long_description,
    long_description_content_type="text/markdown",

    author="author",

    package_dir={"": "alb_autoscaing"},
    packages=setuptools.find_packages(where="alb_autoscaing"),

    install_requires=[
        "aws-cdk.core==1.41.0",
        "aws-cdk.aws-ec2",
        "aws-cdk.aws-iam",
        "aws-cdk.aws-ecr",
        "aws-cdk.aws-autoscaling",
        "aws-cdk.aws-cloudwatch",
        "aws-cdk.aws-elasticloadbalancingv2",
        "aws-cdk.aws-certificatemanager",
        "aws-cdk.aws-route53",
        "aws-cdk.aws_route53-targets"
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
