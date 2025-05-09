# IAM Role for Lambda Execution
resource "aws_iam_role" "lambda_exec_role" {
  name = "lambda_exec_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# IAM Policy: Allow Lambda to Access S3 (Original, Resized Buckets)
resource "aws_iam_policy" "lambda_s3_access" {
  name        = "LambdaS3Access"
  description = "Allows Lambda to read/write S3 objects"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Action    = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:DeleteObject"
        ],
        Resource  = [
          "${aws_s3_bucket.original.arn}/*",
          "${aws_s3_bucket.resized.arn}/*"
        ]
      },
      {
        Effect    = "Allow",
        Action    = ["s3:ListBucket"],
        Resource  = [
          "${aws_s3_bucket.original.arn}"
        ]
      }
    ]
  })
}



# Attach IAM Policy to Lambda Execution Role
resource "aws_iam_role_policy_attachment" "attach_lambda_s3_policy" {
  policy_arn = aws_iam_policy.lambda_s3_access.arn
  role       = aws_iam_role.lambda_exec_role.name
}

#Attach AWS Manages role to write to Cloudwatch
resource "aws_iam_role_policy_attachment" "lambda_cloudwatch" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_exec_role.name
}


# Data source to fetch current account info
data "aws_caller_identity" "current" {}


#Allow only Cloudfront to access original s3 buckets
resource "aws_s3_bucket_policy" "original_bucket_policy" {
  bucket = aws_s3_bucket.original.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = {
        Service = "cloudfront.amazonaws.com"
      },
      Action    = "s3:GetObject",
      Resource  = "${aws_s3_bucket.original.arn}/*",
      Condition = {
        StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.frontend_distribution.id}"
        }
        }
    }]
  })
}


#Allow only Cloudfront to access resized s3 buckets
resource "aws_s3_bucket_policy" "resized_bucket_policy" {
  bucket = aws_s3_bucket.resized.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AllowCloudFrontAccessResizedSecurely",
        Effect    = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Action   = "s3:GetObject",
        Resource = "${aws_s3_bucket.resized.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.frontend_distribution.id}"
          }
        }
      }
    ]
  })
}


#IAM Role for Terraform to Manage S3
resource "aws_iam_policy" "s3_admin_policy" {
  name        = "S3BucketAdminPolicy"
  description = "Allows full management of the S3 bucket, including policy modifications."
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "s3:PutBucketPolicy",
          "s3:GetBucketPolicy",
          "s3:DeleteBucketPolicy"
        ],
        Resource = "${aws_s3_bucket.frontend.arn}"
      }
    ]
  })
}

# Attach to IAM Role
resource "aws_iam_role_policy_attachment" "s3_admin_attach" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.s3_admin_policy.arn
}
