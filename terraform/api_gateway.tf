# API Gateway (HTTP API)
resource "aws_apigatewayv2_api" "image_api" {
  name          = "image-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://image-resizer.fozdigitalz.com"]
    allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    expose_headers = ["ETag"]
    max_age = 3600
  }
}

# API Gateway Stage (Enables Logging and Auto Deploy)
resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.image_api.id
  name        = "prod"
  auto_deploy = true

  # Enable CloudWatch Logging for API Gateway
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigateway_logs.arn
    format          = "$context.requestId $context.httpMethod $context.path $context.status"
  }
}

# Define Unique IDs for Lambda Statement_ID
resource "random_id" "lambda_suffix" {
  byte_length = 8
}

# Lambda Permissions with Unique Statement IDs
resource "aws_lambda_permission" "apigw_presign" {
  statement_id  = "AllowAPIGatewayInvokePresign-${random_id.lambda_suffix.hex}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.presign.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.image_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_list" {
  statement_id  = "AllowAPIGatewayInvokeList-${random_id.lambda_suffix.hex}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.image_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_delete" {
  statement_id  = "AllowAPIGatewayInvokeDelete-${random_id.lambda_suffix.hex}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.image_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_resize" {
  statement_id  = "AllowAPIGatewayInvokeResize-${random_id.lambda_suffix.hex}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resize.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.image_api.execution_arn}/*/*"
}


# Define Lambda Integrations
resource "aws_apigatewayv2_integration" "presign_integration" {
  api_id           = aws_apigatewayv2_api.image_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.presign.invoke_arn
}

resource "aws_apigatewayv2_integration" "list_integration" {
  api_id           = aws_apigatewayv2_api.image_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.list.invoke_arn
}

resource "aws_apigatewayv2_integration" "delete_integration" {
  api_id           = aws_apigatewayv2_api.image_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.delete.invoke_arn
}

resource "aws_apigatewayv2_integration" "resize_integration" {
  api_id           = aws_apigatewayv2_api.image_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.resize.invoke_arn
}

# Define API Routes
resource "aws_apigatewayv2_route" "presign_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "GET /presign"
  target    = "integrations/${aws_apigatewayv2_integration.presign_integration.id}"
}

resource "aws_apigatewayv2_route" "list_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "GET /list"
  target    = "integrations/${aws_apigatewayv2_integration.list_integration.id}"
}

resource "aws_apigatewayv2_route" "delete_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "DELETE /delete"
  target    = "integrations/${aws_apigatewayv2_integration.delete_integration.id}"
}

resource "aws_apigatewayv2_route" "resize_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "POST /resize"
  target    = "integrations/${aws_apigatewayv2_integration.resize_integration.id}"
}

# API Gateway OPTIONS Route (Handles CORS Preflight Requests)
resource "aws_apigatewayv2_route" "options_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "OPTIONS /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.presign_integration.id}"
}

# CloudWatch Log Group for API Gateway Logging
resource "aws_cloudwatch_log_group" "apigateway_logs" {
  name              = "/aws/api-gateway/image-api"
  retention_in_days = 30
}
