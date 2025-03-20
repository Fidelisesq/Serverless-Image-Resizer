const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    if (!event.queryStringParameters || !event.queryStringParameters.fileName) {
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

    const fileName = decodeURIComponent(event.queryStringParameters.fileName);
    
    const params = {
        Bucket: BUCKET_NAME,
        Key: `uploads/${fileName}`
    };

    try {
        const command = new PutObjectCommand(params);
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
