resource "aws_lambda_function" "presign" {
  function_name    = "presign"
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  role            = aws_iam_role.lambda_exec_role.arn
  s3_bucket       = var.lambda_code_bucket
  s3_key          = "presign.zip"
  timeout         = 10

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.original.id
    }
  }
}

resource "aws_lambda_function" "resize" {
  function_name    = "resize"
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  role            = aws_iam_role.lambda_exec_role.arn
  s3_bucket       = var.lambda_code_bucket
  s3_key          = "resize.zip"
  timeout         = 10

  environment {
    variables = {
      INPUT_BUCKET  = aws_s3_bucket.original.id
      OUTPUT_BUCKET = aws_s3_bucket.resized.id
    }
  }
}

resource "aws_lambda_function" "list" {
  function_name    = "list"
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  role            = aws_iam_role.lambda_exec_role.arn
  s3_bucket       = var.lambda_code_bucket
  s3_key          = "list.zip"
  timeout         = 10

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.original.id
    }
  }
}

resource "aws_lambda_function" "delete" {
  function_name    = "delete"
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  role            = aws_iam_role.lambda_exec_role.arn
  s3_bucket       = var.lambda_code_bucket
  s3_key          = "delete.zip"
  timeout         = 10

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.original.id
    }
  }
}
