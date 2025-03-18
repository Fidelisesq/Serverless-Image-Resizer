# Original S3 Bucket (Where User Uploads Go)
resource "aws_s3_bucket" "original" {
  bucket = "original-images-bucket-foz"
  force_destroy = true
}

#Frontend S3 bucket (Website Hosting Bucket)
resource "aws_s3_bucket" "frontend" {
  bucket = "frontend-image-resizer-foz"
}

# Enable Static Website Hosting for Frontend Bucket
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend.id
  index_document {
    suffix = "index.html"
  }
}

#Disable Block Public Access (Allows Terraform to Manage Policies)
resource "aws_s3_bucket_public_access_block" "original_block" {
  bucket                  = aws_s3_bucket.original.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# ✅ Corrected S3 Bucket Policy (Uploads + CloudFront + API Gateway)
resource "aws_s3_bucket_policy" "original_policy" {
  bucket = aws_s3_bucket.original.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [

      # ✅ Allow CloudFront to Access & Serve Images
      {
        Sid    = "AllowCloudFrontAccess",
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

      # ✅ Allow Presigned URL Uploads from Frontend
      {
        Sid    = "AllowPresignedUploads",
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

      # ✅ Allow API Gateway to Upload Files via Presigned URLs
      {
        Sid    = "AllowAPIGatewayPresignedUpload",
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

# ✅ Fix: Enable CORS for S3 Uploads (Presigned URLs)
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



# S3 Bucket for Resized Images
resource "aws_s3_bucket" "resized" {
  bucket = "resized-images-bucket-foz"
}












