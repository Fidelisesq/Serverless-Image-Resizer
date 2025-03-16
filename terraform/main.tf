provider "aws" {
  region = "us-east-1"
}

terraform {
  backend "s3" {
    bucket = "foz-terraform-state-bucket"
    key    = "serverless-image-resizer/terraform.tfstate"
    region = "us-east-1"
  }
}

