# How I Built and Deployed a Serverless Image Resizer on AWS 

In this article, I'll walk through how I built a serverless image resizing application that automatically processes uploaded images to various dimensions. The solution uses AWS services including Lambda, S3, CloudFront, and API Gateway, all deployed with Terraform.

* **S3** for storing original and resized images
* **Lambda** with Sharp for dynamic image resizing
* **API Gateway** for backend routing
* **CloudFront** for global delivery
* **Terraform** for infrastructure as code
* **GitHub Actions** for CI/CD
* A moderate **frontend** using Bootstrap, Select2, and Handlebars.js

## Project Goals

I wanted a fast and cost-effective tool that:

* Lets users upload an image via the browser
* Automatically resizes it to different standard sizes including social-media-optimized dimensions (e.g., Instagram, Facebook)
* Lets them view, download, or delete resized versions

All of this happens without managing any servers - AWS services handle the scaling automatically.

## 📂 Architecture

* **Frontend**: Static HTML/JS/CSS (Bootstrap + Select2 + Handlebars)
* **Backend**:

  * Presigned URL generation via API Gateway + Lambda
  * Resizing with Sharp inside Lambda
  * Original/resized image storage in S3
  * CloudFront with OAC for secure, cacheable access
* **Infra**:

  * Defined via Terraform
  * Deployed through GitHub Actions

## ⚡ Features

* Upload image with presigned PUT URL
* Resize image to presets like Instagram Post, Facebook Share, etc.
* View original and resized images via CloudFront
* Download resized images
* Delete any uploaded image
* Dynamic, grouped dropdowns for resize options
* Success toasts + file input reset after upload

## 📁 Resize Options

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

Select2 was used to enhance the dropdown:

```js
$("#resizeOption").select2({
  placeholder: "-- Choose Size --",
  width: '100%'
});
```

## 🏠 Hosting and CloudFront

The frontend is hosted in an S3 bucket with a CloudFront distribution in front of it.

* Used **Origin Access Control (OAC)** to ensure only CloudFront can read from the buckets
* **Ordered cache behaviors** in CloudFront for different prefixes (`/uploads/`, `/resized-*/uploads/`)

## ⌚ Caching and Performance

I configured CloudFront with very low TTLs to ensure changes show up almost instantly.

```hcl
min_ttl     = 0
default_ttl = 0
max_ttl     = 1
```

This applies to both the original and resized paths.

## 🚀 CI/CD with GitHub Actions

Deployed with a workflow triggered on push to `main`:

* Applies Terraform
* Syncs frontend files to the S3 bucket
* Secrets like AWS credentials and hosted zone IDs are stored in GitHub Secrets

```yaml
- name: Deploy Frontend to S3
  run: aws s3 sync ./frontend s3://image-resizer.fozdigitalz.com --delete
```

## 🌐 Live Project

> **URL:** [https://image-resizer.fozdigitalz.com](https://image-resizer.fozdigitalz.com)

## ✅ Final Touches

* Bootstrap Toast for upload success:

```js
const toast = new bootstrap.Toast(document.getElementById('uploadSuccessToast'));
toast.show();
```

* Clear file input after upload:

```js
$("#customFile").val("");
```

## ✨ What I Learned

* Sharp is powerful but packaging for Lambda takes care
* Use OAC for modern, secure CloudFront-to-S3 setups
* Encoding and naming are key to avoiding S3 403 errors
* A little frontend polish goes a long way (toasts, icons, grouped selects)
* Infrastructure-as-Code + CI/CD saves hours of rebuild time

## 🚜 Next Ideas

* Add image analytics (view/download tracking)
* Expire resized images after 7 days
* Admin dashboard with storage usage and event charts
* Auto-email notifications for expiring objects (SES)

## 🔍 Try It Yourself!

You can find the full source code here:
👉 [GitHub Repo](#) ← replace this with your repo URL

---

If you found this useful or inspiring, leave a ❤️ or comment below — I'd love to see what others build on top of this!

Happy building! 🚀


## How the Application Works
Absolutely — here’s a clear **step-by-step flow of how data moves through your Serverless Image Resizer architecture**:

---

## 🔄 Serverless Image Resizer: Flow of Information

---

### 🧍‍♀️ 1. **User Opens Web App (Frontend)**

* Browser loads static files (HTML, JS, CSS) from **CloudFront**.
* CloudFront fetches the `index.html` and `app.js` from the **frontend S3 bucket** (protected via OAC).

---

### 📸 2. **User Selects an Image & Resize Size**

* User selects a file and a predefined resize size (e.g., `1080x1080`) from a dropdown.

---

### 🔐 3. **Frontend Requests Presigned Upload URL**

* Frontend makes a **GET request** to:

  ```
  GET /presign?fileName=<name>&resizeSize=<size>
  ```
* This hits **API Gateway**, which routes it to the **Presign Lambda**.
* The Lambda generates a **presigned S3 PUT URL** for the **original bucket**.
* Response is returned to the browser.

---

### ☁️ 4. **User Uploads Image to S3 via Presigned URL**

* Browser uses `PUT` to upload the file directly to the **original S3 bucket** using the presigned URL.
* Upload includes metadata indicating the resize size.

---

### ⚙️ 5. **S3 Triggers Resize Lambda**

* The **original bucket** is configured with an **S3 event notification** that triggers the **Resize Lambda** on new uploads.
* The Lambda reads the image, resizes it using **Sharp**, and stores the result in the **resized bucket** under a key like:

  ```
  resized-1080x1080/uploads/<filename>
  ```

---

### 🌐 6. **User Loads Image List**

* When the user clicks **“Load My Images”**, the frontend calls:

  ```
  GET /list
  ```
* API Gateway routes the call to the **List Lambda**, which returns all object keys from the **original bucket**.

---

### 👁️ 7. **User Views or Downloads Images**

* Frontend constructs CloudFront URLs for:

  * Original: `https://<CF_DOMAIN>/uploads/<filename>`
  * Resized: `https://<CF_DOMAIN>/resized-1080x1080/uploads/<filename>`
* User clicks to view or download.
* CloudFront fetches the image from **S3 (original or resized)** using OAC.

---

### 🗑️ 8. **User Deletes an Image**

* Frontend calls:

  ```
  DELETE /delete?fileName=uploads/<filename>
  ```
* API Gateway routes to the **Delete Lambda**, which deletes the image from the **original S3 bucket**.

---

### 🧑‍💻 9. **Deployment Flow (CI/CD)**

* Push to GitHub triggers GitHub Actions:

  * Terraform is applied to manage infrastructure
  * Frontend files are synced to the S3 bucket
  * Secrets are injected via GitHub Secrets (e.g., AWS creds, hosted zone ID)

---

## 🧭 Summary of Key Paths

| Flow         | Origin                           | Destination |
| ------------ | -------------------------------- | ----------- |
| App Load     | CloudFront → S3 (frontend)       |             |
| Presign URL  | Frontend → API Gateway → Lambda  |             |
| Upload       | Browser → S3 (original)          |             |
| Resize       | S3 event → Lambda → S3 (resized) |             |
| List Images  | Frontend → API Gateway → Lambda  |             |
| View Image   | CloudFront → S3 (via OAC)        |             |
| Delete Image | Frontend → API Gateway → Lambda  |             |
| CI/CD Deploy | GitHub Actions → AWS             |             |

---

Would you like this written as a sequence diagram or flowchart too?
