# Zip Lambda code and upload to S3
resource "null_resource" "lambda_zip" {
  provisioner "local-exec" {
    command = "cd ${path.module}/../lambda/presign && zip -r ../presign.zip ."
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../lambda/resize && zip -r ../resize.zip ."
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../lambda/list && zip -r ../list.zip ."
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../lambda/delete && zip -r ../delete.zip ."
  }

  triggers = {
    always_run = "${timestamp()}"
  }
}

resource "aws_s3_object" "lambda_presign" {
  depends_on = [null_resource.lambda_zip]
  bucket = aws_s3_bucket.lambda_code_bucket.bucket
  key    = "presign.zip"
  source = "${path.module}/../lambda/presign.zip"
}

resource "aws_s3_object" "lambda_resize" {
  depends_on = [null_resource.lambda_zip]
  bucket = aws_s3_bucket.lambda_code_bucket.bucket
  key    = "resize.zip"
  source = "${path.module}/../lambda/resize.zip"
}

resource "aws_s3_object" "lambda_list" {
  depends_on = [null_resource.lambda_zip]
  bucket = aws_s3_bucket.lambda_code_bucket.bucket
  key    = "list.zip"
  source = "${path.module}/../lambda/list.zip"
}

resource "aws_s3_object" "lambda_delete" {
  depends_on = [null_resource.lambda_zip]
  bucket = aws_s3_bucket.lambda_code_bucket.bucket
  key    = "delete.zip"
  source = "${path.module}/../lambda/delete.zip"
}

# Lambda Functions with source_code_hash for automatic updates
resource "aws_lambda_function" "presign" {
  depends_on       = [aws_s3_object.lambda_presign]
  function_name    = "presign"
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  role            = aws_iam_role.lambda_exec_role.arn
  s3_bucket       = aws_s3_bucket.lambda_code_bucket.bucket
  s3_key          = "presign.zip"
  timeout         = 10
  source_code_hash = filebase64sha256("${path.module}/../lambda/presign.zip")

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.original.id
    }
  }
}

resource "aws_lambda_function" "resize" {
  depends_on       = [aws_s3_object.lambda_resize]
  function_name    = "resize"
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  role            = aws_iam_role.lambda_exec_role.arn
  s3_bucket       = aws_s3_bucket.lambda_code_bucket.bucket
  s3_key          = "resize.zip"
  timeout         = 10
  source_code_hash = filebase64sha256("${path.module}/../lambda/resize.zip")

  environment {
    variables = {
      INPUT_BUCKET  = aws_s3_bucket.original.id
      OUTPUT_BUCKET = aws_s3_bucket.resized.id
    }
  }
}

resource "aws_lambda_function" "list" {
  depends_on       = [aws_s3_object.lambda_list]
  function_name    = "list"
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  role            = aws_iam_role.lambda_exec_role.arn
  s3_bucket       = aws_s3_bucket.lambda_code_bucket.bucket
  s3_key          = "list.zip"
  timeout         = 10
  source_code_hash = filebase64sha256("${path.module}/../lambda/list.zip")

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.original.id
    }
  }
}

resource "aws_lambda_function" "delete" {
  depends_on       = [aws_s3_object.lambda_delete]
  function_name    = "delete"
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  role            = aws_iam_role.lambda_exec_role.arn
  s3_bucket       = aws_s3_bucket.lambda_code_bucket.bucket
  s3_key          = "delete.zip"
  timeout         = 10
  source_code_hash = filebase64sha256("${path.module}/../lambda/delete.zip")

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.original.id
    }
  }
}
