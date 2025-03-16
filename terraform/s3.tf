# S3 Bucket for Original Images
resource "aws_s3_bucket" "original" {
  bucket = "original-images-bucket-foz"
}

# S3 Bucket for Resized Images
resource "aws_s3_bucket" "resized" {
  bucket = "resized-images-bucket-foz"
}

# S3 Bucket for Frontend Hosting
resource "aws_s3_bucket" "frontend" {
  bucket = "image-resizer.fozdigitalz.com"
}

# Policy: Allow Public Read Access to the Frontend Bucket (For CloudFront)
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = "*",
      Action    = "s3:GetObject",
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
    }]
  })
}

# Enable Static Website Hosting for Frontend Bucket
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend.id
  index_document {
    suffix = "index.html"
  }
}

# Policy: Restrict Image Buckets to CloudFront (For Security)
resource "aws_s3_bucket_policy" "original_bucket_policy" {
  bucket = aws_s3_bucket.original.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.original.arn}/*"
      }
    ]
  })
}

# S3 Bucket for Lambda Deployment Packages
resource "aws_s3_bucket" "lambda_code" {
  bucket = "lambda-code-bucket-foz"
}

# Policy: Allow Terraform IAM Role & Lambda to Read Objects
resource "aws_s3_bucket_policy" "lambda_code_policy" {
  bucket = aws_s3_bucket.lambda_code.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = "*",
        Action    = ["s3:GetObject", "s3:PutObject"],
        Resource  = "${aws_s3_bucket.lambda_code.arn}/*"
      }
    ]
  })
}
