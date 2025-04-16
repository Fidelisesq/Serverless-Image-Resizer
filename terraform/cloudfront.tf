# CloudFront Origin Access Control (OAC) for Secure S3 Access
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "frontend-oac"
  description                       = "OAC for CloudFront to access S3 bucket securely"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Response Headers Policy for CORS (Presigned Upload Support)
resource "aws_cloudfront_response_headers_policy" "cors_policy" {
  name = "ImageResizerCORS"

  cors_config {
    access_control_allow_origins {
      items = ["https://image-resizer.fozdigitalz.com"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS", "PUT", "POST"]
    }
    access_control_allow_headers {
      items = ["*"]
    }
    access_control_allow_credentials = false
    access_control_max_age_sec       = 86400
    origin_override                  = true
  }
}

# CloudFront Distribution with origins for frontend, original, and resized buckets
resource "aws_cloudfront_distribution" "frontend_distribution" {
  enabled             = true
  default_root_object = "index.html"

  aliases = [var.frontend_domain_name]

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  origin {
    domain_name              = aws_s3_bucket.original.bucket_regional_domain_name
    origin_id                = "S3-original"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  origin {
    domain_name              = aws_s3_bucket.resized.bucket_regional_domain_name
    origin_id                = "S3-resized"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  default_cache_behavior {
    target_origin_id       = "S3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Authorization"]
      cookies {
        forward = "none"
      }
    }

    response_headers_policy_id = aws_cloudfront_response_headers_policy.cors_policy.id
  }

  # Match: /uploads/*
  ordered_cache_behavior {
    path_pattern           = "uploads/*"
    target_origin_id       = "S3-original"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    response_headers_policy_id = aws_cloudfront_response_headers_policy.cors_policy.id
  }

  # Match: /resized-800x600/uploads/* or similar
  ordered_cache_behavior {
    path_pattern           = "resized-*/uploads/*"
    target_origin_id       = "S3-resized"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    response_headers_policy_id = aws_cloudfront_response_headers_policy.cors_policy.id
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
