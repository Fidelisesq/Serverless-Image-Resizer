const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
    console.log("Event:", JSON.stringify(event));

    const queryParams = event.queryStringParameters || {};
    const fileName = queryParams.fileName;
    const resizeSize = queryParams.resizeSize;

    if (!fileName) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ message: "Missing fileName parameter" })
        };
    }

    const key = `uploads/${fileName}`;
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: "image/jpeg", // optional: you can also pass contentType from query param
        Metadata: {
            "resize-size": resizeSize || ""
        }
    });

    try {
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*"
            },
            body: JSON.stringify({ url: signedUrl })
        };
    } catch (err) {
        console.error("Presign error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to generate presigned URL" })
        };
    }
};
