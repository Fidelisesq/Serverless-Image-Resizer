# Zip Lambda code and upload it to S3
resource "null_resource" "lambda_zip" {
  depends_on = [aws_s3_bucket.lambda_code_bucket]

  provisioner "local-exec" {
    command = "zip -r presign.zip ./lambda/presign"
    working_dir = "${path.module}/../lambda"
  }

  provisioner "local-exec" {
    command = "zip -r resize.zip ./lambda/resize"
    working_dir = "${path.module}/../lambda"
  }

  provisioner "local-exec" {
    command = "zip -r list.zip ./lambda/list"
    working_dir = "${path.module}/../lambda"
  }

  provisioner "local-exec" {
    command = "zip -r delete.zip ./lambda/delete"
    working_dir = "${path.module}/../lambda"
  }

  provisioner "local-exec" {
    command = "aws s3 cp presign.zip s3://${aws_s3_bucket.lambda_code_bucket.bucket}/presign.zip"
    working_dir = "${path.module}/lambda"
  }

  provisioner "local-exec" {
    command = "aws s3 cp resize.zip s3://${aws_s3_bucket.lambda_code_bucket.bucket}/resize.zip"
    working_dir = "${path.module}/lambda"
  }

  provisioner "local-exec" {
    command = "aws s3 cp list.zip s3://${aws_s3_bucket.lambda_code_bucket.bucket}/list.zip"
    working_dir = "${path.module}/lambda"
  }

  provisioner "local-exec" {
    command = "aws s3 cp delete.zip s3://${aws_s3_bucket.lambda_code_bucket.bucket}/delete.zip"
    working_dir = "${path.module}/lambda"
  }

  triggers = {
    always_run = "${timestamp()}"
  }
}



# Lambda Functions (Presign, Resize, List, Delete)
resource "aws_lambda_function" "presign" {
  function_name    = "presign"
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  role            = aws_iam_role.lambda_exec_role.arn
  s3_bucket       = aws_s3_bucket.lambda_code_bucket.bucket
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
  s3_bucket       = aws_s3_bucket.lambda_code_bucket.bucket
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
  s3_bucket       = aws_s3_bucket.lambda_code_bucket.bucket
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
  s3_bucket       = aws_s3_bucket.lambda_code_bucket.bucket
  s3_key          = "delete.zip"
  timeout         = 10

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.original.id
    }
  }
}
