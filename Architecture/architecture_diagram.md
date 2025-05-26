# Serverless Image Resizer - Architecture Diagram


### 1. Frontend Serving Flow
- User requests the application at `https://image-resizer.fozdigitalz.com`
- CloudFront distribution receives the request and routes it to the S3 frontend bucket
- S3 frontend bucket serves the static website files (HTML, CSS, JS)
- The frontend application loads in the user's browser

### 2. Image Upload Flow
- User selects an image and resize option in the frontend
- Frontend calls the API Gateway `/presign` endpoint
- API Gateway triggers the Presign Lambda function
- Presign Lambda generates a presigned URL for S3 upload with metadata including resize dimensions
- Frontend receives the presigned URL and uploads the image directly to the S3 original bucket
- S3 original bucket receives the image in the `uploads/` prefix

### 3. Image Resize Flow (Automatic)
- S3 original bucket triggers an event notification when a new image is uploaded
- The event invokes the Resize Lambda function
- Resize Lambda:
  1. Retrieves the original image from S3 original bucket
  2. Extracts the resize dimensions from the image metadata
  3. Resizes the image using the Sharp library
  4. Uploads the resized image to the S3 resized bucket with path `resized-{dimensions}/uploads/{filename}`

### 4. Image Management Flow
- User clicks "Load My Images" in the frontend
- Frontend calls the API Gateway `/list` endpoint
- API Gateway triggers the List Lambda function
- List Lambda returns a list of images from the S3 original bucket
- Frontend displays the images with links to both original and resized versions
- User can:
  - View the original image via CloudFront
  - Download the resized image via CloudFront
  - Delete an image by calling the API Gateway `/delete` endpoint

### 5. Image Deletion Flow
- User clicks "Delete" on an image
- Frontend calls the API Gateway `/delete` endpoint with the image filename
- API Gateway triggers the Delete Lambda function
- Delete Lambda removes the image from the S3 original bucket

## Key Components

1. **Frontend (S3 + CloudFront)**
   - Static website hosted in S3
   - CloudFront distribution for global content delivery and HTTPS

2. **API Gateway**
   - HTTP API with routes for presign, list, and delete operations
   - CORS configured to allow requests from the frontend domain

3. **Lambda Functions**
   - Presign: Generates presigned URLs for secure direct uploads
   - List: Returns a list of uploaded images
   - Delete: Removes images from storage
   - Resize: Processes and resizes images (triggered by S3 events)

4. **S3 Buckets**
   - Frontend: Hosts the static website files
   - Original: Stores the original uploaded images
   - Resized: Stores the resized versions of images

5. **IAM Roles and Policies**
   - Lambda execution role with permissions to access S3 buckets
   - S3 bucket policies to restrict access to CloudFront and authorized services

## Security Considerations
- CloudFront uses Origin Access Control (OAC) to securely access S3 buckets
- S3 buckets are not directly accessible to the public
- Presigned URLs are used for secure, time-limited uploads
- CORS is configured to restrict access to the application domain
- API Gateway is configured with proper CORS headers