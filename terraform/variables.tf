variable "hosted_zone_id" {
    description = "Domain Hosted Zone ID"
    type=  string
}

variable "frontend_domain_name" {
    description = "Domain Name"
    type=  string
}


variable "acm_certificate_arn" {
    description = "Domain Name"
    type =  string
}

/*
variable "lambda_code_bucket" {
  description = "S3 bucket for storing Lambda function zip files"
  type        = string
}
*/



