output "s3_original_bucket" {
  value = aws_s3_bucket.original.id
}

output "s3_resized_bucket" {
  value = aws_s3_bucket.resized.id
}

output "api_gateway_url" {
  value = aws_apigatewayv2_api.image_api.api_endpoint
}
