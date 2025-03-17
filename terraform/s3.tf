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
  force_destroy = true
}

# Enable Static Website Hosting for Frontend Bucket
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend.id
  index_document {
    suffix = "index.html"
  }
}









