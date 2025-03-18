const AWS = require("aws-sdk");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
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

    const params = {
        Bucket: BUCKET_NAME,
        Key: `uploads/${fileName}`,
        Expires: 300
    };

    try {
        const signedUrl = await s3.getSignedUrlPromise("putObject", params);

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
