# 🚀 Fix: Declare the frontend, original, and resized S3 buckets
resource "aws_s3_bucket" "frontend" {
  bucket = "image-resizer.fozdigitalz.com"
  force_destroy = true
}

resource "aws_s3_bucket" "original" {
  bucket = "original-images-bucket-foz"
  force_destroy = true
}

resource "aws_s3_bucket" "resized" {
  bucket = "resized-images-bucket-foz" 
  force_destroy = true
}

# Ensure Public Access Block is Disabled (So Terraform Can Apply Policies)
resource "aws_s3_bucket_public_access_block" "original_block" {
  bucket                  = aws_s3_bucket.original.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "resized_block" {
  bucket                  = aws_s3_bucket.resized.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket Policy for Original & Resized Buckets
resource "aws_s3_bucket_policy" "original_policy" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [

      #CloudFront to Access & Serve Images from "original"
      {
        Sid    = "AllowCloudFrontOriginal",
        Effect = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Action   = "s3:GetObject",
        Resource = "${aws_s3_bucket.original.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.frontend_distribution.id}"
          }
        }
      },

      # Allow Users to Upload via Presigned URL to "original"
      {
        Sid    = "AllowPresignedUploadsOriginal",
        Effect = "Allow",
        Principal = "*",
        Action   = "s3:PutObject",
        Resource = "${aws_s3_bucket.original.arn}/uploads/*",
        Condition = {
          StringLike = {
            "aws:Referer" = "https://image-resizer.fozdigitalz.com"
          }
        }
      },

      # Allow API Gateway to Upload to "original"
      {
        Sid    = "AllowAPIGatewayUploadOriginal",
        Effect = "Allow",
        Principal = {
          Service = "apigateway.amazonaws.com"
        },
        Action   = "s3:PutObject",
        Resource = "${aws_s3_bucket.original.arn}/uploads/*"
      }
    ]
  })
}

#S3 Policy for Resized Bucket (Accessible for Downloads)
resource "aws_s3_bucket_policy" "resized_policy" {
  bucket = aws_s3_bucket.resized.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [

      # Allow CloudFront to Serve Resized Images
      {
        Sid    = "AllowCloudFrontResized",
        Effect = "Allow",
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

# Enable CORS for S3 Uploads & Resized Access
resource "aws_s3_bucket_cors_configuration" "original_cors" {
  bucket = aws_s3_bucket.original.id

  cors_rule {
    allowed_methods = ["GET", "HEAD", "PUT", "POST"]
    allowed_origins = ["https://image-resizer.fozdigitalz.com"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_cors_configuration" "resized_cors" {
  bucket = aws_s3_bucket.resized.id

  cors_rule {
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://image-resizer.fozdigitalz.com"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
