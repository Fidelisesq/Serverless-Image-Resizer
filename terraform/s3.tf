resource "aws_s3_bucket" "original" {
  bucket = "original-images-bucket-foz"
}

resource "aws_s3_bucket" "resized" {
  bucket = "resized-images-bucket-foz"
}

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
