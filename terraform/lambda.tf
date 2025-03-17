# Lambda Function for Presign
resource "aws_lambda_function" "presign" {
  function_name    = "presign"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_exec_role.arn
  filename         = "${path.module}/lambda/presign.zip"  # Reference the local zip file directly
  timeout          = 10
  source_code_hash = filebase64sha256("${path.module}/lambda/presign.zip")  # Hash for integrity check

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.original.id
    }
  }
}

# Lambda Function for Resize
resource "aws_lambda_function" "resize" {
  function_name    = "resize"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_exec_role.arn
  filename         = "${path.module}/lambda/resize.zip"  # Reference the local zip file directly
  timeout          = 10
  source_code_hash = filebase64sha256("${path.module}/lambda/resize.zip")  # Hash for integrity check

  environment {
    variables = {
      INPUT_BUCKET  = aws_s3_bucket.original.id
      OUTPUT_BUCKET = aws_s3_bucket.resized.id
    }
  }
}

# Lambda Function for List
resource "aws_lambda_function" "list" {
  function_name    = "list"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_exec_role.arn
  filename         = "${path.module}/lambda/list.zip"  # Reference the local zip file directly
  timeout          = 10
  source_code_hash = filebase64sha256("${path.module}/lambda/list.zip")  # Hash for integrity check

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.original.id
    }
  }
}

# Lambda Function for Delete
resource "aws_lambda_function" "delete" {
  function_name    = "delete"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_exec_role.arn
  filename         = "${path.module}/lambda/delete.zip"  # Reference the local zip file directly
  timeout          = 10
  source_code_hash = filebase64sha256("${path.module}/lambda/delete.zip")  # Hash for integrity check

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.original.id
    }
  }
}
