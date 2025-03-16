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

# IAM Policy: Allow Lambda to Access S3 (Original, Resized, and Lambda Code Buckets)
resource "aws_iam_policy" "lambda_s3_access" {
  name        = "LambdaS3Access"
  description = "Allows Lambda to read/write S3 objects"
  policy      = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Action    = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
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

# Policy: Allow Terraform IAM Role & Lambda to Read/Write to S3
resource "aws_s3_bucket_policy" "lambda_code_policy" {
  bucket = aws_s3_bucket.lambda_code_bucket.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow"
        Principal = {
          AWS = [
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/Fidelisesq",  
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LambdaExecutionRole"  # Lambda Execution Role ARN
          ]
        }
        Action    = ["s3:GetObject", "s3:PutObject"]
        Resource  = "${aws_s3_bucket.lambda_code_bucket.arn}/*"
      }
    ]
  })
}

