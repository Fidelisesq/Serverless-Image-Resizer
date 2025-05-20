# Serverless Image Resizer on AWS 
![Architecture Diagram](https://github.com/Fidelisesq/Serverless-Image-Resizer/blob/main/Architecture/Serverless%20Diagram.png)

Need perfect image sizes for social media or websites? My AWS-powered solution does it automatically. Just upload, select dimensions (Instagram, Facebook, etc.), and get optimized versions in seconds—no servers to manage.

Here, I'll walk through how I built the solution using AWS services including Lambda, S3, CloudFront, and API Gateway, all deployed with Terraform.

* **S3** for storing original and resized images
* **Lambda** with Sharp for dynamic image resizing
* **API Gateway** for backend routing
* **CloudFront** for global delivery
* **Terraform** for infrastructure as code
* **GitHub Actions** for CI/CD
* A moderate **frontend** using Bootstrap, Select2, and Handlebars.js

In order to keep the lenght of this article moderate, I kept the project configuration out of this post. Please find them in my ![Github Page](https://github.com/Fidelisesq/Serverless-Image-Resizer)


## Project Goals

I wanted a fast and cost-effective tool that:

* Lets users upload an image via the browser
* Automatically resizes it to different standard sizes including social-media-optimized dimensions (e.g., Instagram, Facebook)
* Lets them view, download, or delete resized versions

All of this happens without managing any servers - AWS services handle the scaling automatically.

## Architecture

* **Frontend**: Static HTML/JS/CSS (Bootstrap + Select2 + Handlebars)
* **Backend**:

  * Presigned URL generation via API Gateway + Lambda
  * Resizing with Sharp inside Lambda
  * Original/resized image storage in S3
  * CloudFront with OAC for secure, cacheable access
* **Infrastructure Management**:

  * Defined via Terraform
  * Deployed through GitHub Actions


### Frontend - Hosting, Cloudfront + Custom Domain


The frontend is hosted in an S3 bucket with a CloudFront distribution to serve it globally. I used Route53 custom domain, which route traffic to cloudfront.

I defined grouped resize sizes dynamically in JavaScript:

```js
const resizeOptionsGrouped = [
  {
    groupName: "Social Media Sizes",
    options: [
      { platform: "Instagram 📸", label: "Post", size: "1080x1080" },
      { platform: "Facebook 📘", label: "Shared Image", size: "1200x630" },
      { platform: "Twitter/X 🐦", label: "Summary", size: "1200x675" },
      { platform: "LinkedIn 💼", label: "Link Image", size: "1200x627" },
      { platform: "YouTube ▶️", label: "Thumbnail", size: "1280x720" }
    ]
  },
  {
    groupName: "Standard Sizes",
    options: [
      { platform: "Thumbnail 🗃️", label: "", size: "150x150" },
      { platform: "Medium", label: "", size: "640x480" },
      { platform: "Large", label: "", size: "800x600" },
      { platform: "Full HD", label: "", size: "1920x1080" }
    ]
  }
];
```

* Also, I used **Origin Access Control (OAC)** to ensure only CloudFront can read from the buckets
* **Ordered cache behaviors** in CloudFront for different prefixes (`/uploads/`, `/resized-*/uploads/`)
* I added 3 origins to my Cloudfront distribution - one for the S3 that hosts the frontend, one each for the bucket that keeps the original image upload and the one that stores the resized images.

#### Caching and Performance

I configured CloudFront with very low TTLs to ensure changes show up almost instantly.

```hcl
min_ttl     = 0
default_ttl = 0
max_ttl     = 1
```

This applies to both the original and resized paths.

### **Backend: Serverless Power with API Gateway & Lambda**

The backend orchestrates image processing through a seamless AWS serverless stack:

#### **API Gateway: The Traffic Controller**
- Serves as the single entry point for all frontend requests
- Configured with CORS to securely allow requests only from your frontend domain
- Routes requests to specific Lambda functions based on path/verb:
  ```terraform
  # Example route definition for Presigm Lambda in Terraform
  resource "aws_apigatewayv2_route" "presign_route" {
    api_id = aws_apigatewayv2_api.image_api.id
    route_key = "GET /presign"  # Routes to presign Lambda
    target    = "integrations/${aws_apigatewayv2_integration.presign_integration.id}"
  }
  ```

#### **Lambda Functions: Specialized Workers**
Four dedicated functions handle distinct tasks:

1. **Presign Lambda**  
   - Generates secure S3 upload URLs with metadata
   ```javascript
   const signedUrl = await getSignedUrl(s3, putCommand, { expiresIn: 300 });
   ```

2. **Resize Lambda**  
   - Triggered by S3 upload events
   - Uses Sharp to process images to requested dimensions
   ```javascript
   await sharp(imageBuffer).resize(width, height).toBuffer();
   ```

3. **List Lambda**  
   - Returns all uploaded images for the UI gallery
   ```javascript
   const data = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME }));
   ```

4. **Delete Lambda**  
   - Removes images from S3 when requested
   ```javascript
   await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: fileName }));
   ```

#### **Key Integration Features**
- **Zero cold starts**: Configured with provisioned concurrency
- **Secure communication**: IAM permissions strictly limit API Gateway→Lambda access
- **Auto-scaling**: Handles spikes in traffic without manual intervention

This serverless approach eliminates infrastructure management while providing enterprise-grade reliability and performance.

--- 

## CI/CD with GitHub Actions

Deployed with a workflow triggered on push to `main`. My workflow can also be manually triggered to run or destroy my infrastructure using Terraform. 

* Applies Terraform
* Syncs frontend files to the S3 bucket
* Secrets like AWS credentials and hosted zone IDs are stored in GitHub Secrets

```yaml
- name: Deploy Frontend to S3
  run: aws s3 sync ./frontend s3://image-resizer.fozdigitalz.com --delete
```

## 🌐 Live Project
Check the application with the URL below.
> **URL:** [https://image-resizer.fozdigitalz.com](https://image-resizer.fozdigitalz.com)

![App Home Page](https://github.com/Fidelisesq/Serverless-Image-Resizer/blob/main/Architecture/Application.png)

#### How to Use the Application
1. **Open the web app** – Your browser loads files from CloudFront, which fetches them from a secure S3 bucket.  
2. **Select an image & size** – Choose a file and a preset dimension (e.g., Instagram’s 1080x1080).  
3. **Request upload URL** – The frontend gets a secure S3 upload link via API Gateway + Lambda.  
4. **Upload directly to S3** – Your browser sends the image to S3 using the generated link.  
5. **Auto-resize triggered** – S3 detects the upload, fires a Lambda to resize with Sharp, and saves the result in a resized folder.  
6. **View/download images** – Click "Load My Images" to see originals/resized versions, delivered via CloudFront and download th resized if you want.  
7. **Delete anytime** – Hit delete, and a Lambda removes the file from S3.  


