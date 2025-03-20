import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const queryParams = event.queryStringParameters || {};
    const fileName = queryParams.fileName;

    if (!fileName) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "https://image-resizer.fozdigitalz.com",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ message: "Missing fileName" })
        };
    }

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `uploads/${fileName}`
    });

    try {
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "https://image-resizer.fozdigitalz.com",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ url: signedUrl })
        };
    } catch (err) {
        console.error("Error generating presigned URL:", err);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "https://image-resizer.fozdigitalz.com",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};
