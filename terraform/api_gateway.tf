resource "aws_apigatewayv2_api" "image_api" {
  name          = "image-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.image_api.id
  name        = "prod"
  auto_deploy = true
}

# Define Lambda permissions for API Gateway to invoke
resource "aws_lambda_permission" "apigw_presign" {
  statement_id  = "AllowAPIGatewayInvokePresign"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.presign.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.image_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_list" {
  statement_id  = "AllowAPIGatewayInvokeList"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.image_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_delete" {
  statement_id  = "AllowAPIGatewayInvokeDelete"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.image_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_resize" {
  statement_id  = "AllowAPIGatewayInvokeResize"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resize.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.image_api.execution_arn}/*/*"
}

# Define integrations
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

# Create routes, referencing integrations
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
