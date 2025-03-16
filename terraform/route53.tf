resource "aws_route53_record" "frontend_dns" {
  zone_id = var.hosted_zone_id  # My existing Hosted Zone ID for fozdigitalz.com
  name    = var.frontend_domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.frontend_distribution.hosted_zone_id  # CloudFront's Hosted Zone ID
    evaluate_target_health = false  # CloudFront does not support health checks
  }
}
