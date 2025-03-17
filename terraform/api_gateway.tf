resource "aws_apigatewayv2_api" "image_api" {
  name          = "image-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.image_api.id
  name        = "prod"
  auto_deploy = true
}

# Define integration
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

# Create the routes, reference integrations
resource "aws_apigatewayv2_route" "presign_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "GET /presign"
  target    = "integrations/${aws_apigatewayv2_integration.presign_integration.id}"  # Corrected target
}

resource "aws_apigatewayv2_route" "list_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "GET /list"
  target    = "integrations/${aws_apigatewayv2_integration.list_integration.id}"  # Corrected target
}

resource "aws_apigatewayv2_route" "delete_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "DELETE /delete"
  target    = "integrations/${aws_apigatewayv2_integration.delete_integration.id}"  # Corrected target
}


resource "aws_apigatewayv2_route" "resize_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "POST /resize"  # You can change this route key as needed (e.g., POST method for resizing images)
  target    = "integrations/${aws_apigatewayv2_integration.resize_integration.id}"  # Corrected target
}
