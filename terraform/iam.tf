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
        Action    = ["s3:GetObject", "s3:PutObject", "s3:ListBucket", "s3:DeleteObject"],
        Resource  = [
          "${aws_s3_bucket.original.arn}/*",
          "${aws_s3_bucket.resized.arn}/*"
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
          "AWS:SourceArn" = aws_cloudfront_distribution.frontend_distribution.arn
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
    Statement = [{
      Effect    = "Allow",
      Principal = {
        Service = "cloudfront.amazonaws.com"
      },
      Action    = "s3:GetObject",
      Resource  = "${aws_s3_bucket.resized.arn}/*",
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.frontend_distribution.arn
        }
      }
    }]
  })
}


#S3 bucket policy for Cloudfront access
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess",
        Effect = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Action   = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        Resource = "${aws_s3_bucket.frontend.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.frontend_distribution.id}"
          }
        }
      }
    ]
  })
}
