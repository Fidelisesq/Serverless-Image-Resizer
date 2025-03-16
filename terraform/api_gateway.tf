resource "aws_apigatewayv2_api" "image_api" {
  name          = "image-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.image_api.id
  name        = "prod"
  auto_deploy = true
}

resource "aws_apigatewayv2_route" "presign_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "GET /presign"
  target    = "integrations/${aws_lambda_function.presign.arn}"
}

resource "aws_apigatewayv2_route" "list_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "GET /list"
  target    = "integrations/${aws_lambda_function.list.arn}"
}

resource "aws_apigatewayv2_route" "delete_route" {
  api_id    = aws_apigatewayv2_api.image_api.id
  route_key = "DELETE /delete"
  target    = "integrations/${aws_lambda_function.delete.arn}"
}

resource "aws_apigatewayv2_integration" "presign_integration" {
  api_id           = aws_apigatewayv2_api.image_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.presign.invoke_arn
}
