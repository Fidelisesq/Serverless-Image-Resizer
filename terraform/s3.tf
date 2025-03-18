# 🚀 Declare the S3 Buckets
resource "aws_s3_bucket" "frontend" {
  bucket = "image-resizer.fozdigitalz.com"
}

resource "aws_s3_bucket" "original" {
  bucket = "original-images-bucket-foz"
}

resource "aws_s3_bucket" "resized" {
  bucket = "resized-images-bucket-foz"
}

# ✅ Fix: Disable Public Access Block (Ensures Terraform Can Apply Policies)
resource "aws_s3_bucket_public_access_block" "frontend_block" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "original_block" {
  bucket = aws_s3_bucket.original.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "resized_block" {
  bucket = aws_s3_bucket.resized.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# ✅ Fix: Attach Policy to Frontend Bucket (For CloudFront & Uploads)
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id  # ✅ Attach policy to frontend (CloudFront)

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [

      # ✅ Allow CloudFront to Access & Serve Website (Frontend Bucket)
      {
        Sid    = "AllowCloudFrontAccessFrontend",
        Effect = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Action   = "s3:GetObject",
        Resource = "${aws_s3_bucket.frontend.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.frontend_distribution.id}"
          }
        }
      },

      # ✅ Allow Users to Upload via Presigned URL to "original" (Uploads)
      {
        Sid    = "AllowPresignedUploadsToOriginal",
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

      # ✅ Allow API Gateway to Upload to "original"
      {
        Sid    = "AllowAPIGatewayUploadToOriginal",
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

# ✅ Fix: Allow CloudFront to Serve Processed Images from "resized"
resource "aws_s3_bucket_policy" "resized_policy" {
  bucket = aws_s3_bucket.resized.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowCloudFrontAccessResized",
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

# ✅ Enable CORS for Uploads & Image Access (Original Bucket)
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

# ✅ Enable CORS for Resized Bucket (For CloudFront Access)
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
