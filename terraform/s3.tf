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

# Create the S3 bucket to store Lambda code
resource "aws_s3_bucket" "lambda_code_bucket" {
  bucket = var.lambda_code_bucket
}

# Enable versioning on the bucket
resource "aws_s3_bucket_versioning" "lambda_code_bucket_versioning" {
  bucket = aws_s3_bucket.lambda_code_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

/*
# Block all public access for the Lambda code bucket
resource "aws_s3_bucket_public_access_block" "lambda_code_bucket_block" {
  bucket = aws_s3_bucket.lambda_code_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
*/







