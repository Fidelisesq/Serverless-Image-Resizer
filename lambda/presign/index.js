const AWS = require("aws-sdk");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
    try {
        const queryParams = event.queryStringParameters || {};
        const fileName = queryParams.fileName;
        const resizeOption = queryParams.size || "400x400"; // Default size

        if (!fileName) {
            return { statusCode: 400, body: JSON.stringify({ message: "Missing fileName" }) };
        }

        const params = {
            Bucket: BUCKET_NAME,
            Key: `uploads/${fileName}`,
            Expires: 300,
            Conditions: [{ acl: "private" }],
        };

        const signedUrl = await s3.createPresignedPost(params);

        return {
            statusCode: 200,
            body: JSON.stringify({
                url: signedUrl.url,
                fields: signedUrl.fields,
                resizeOption: resizeOption
            })
        };
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
    }
};
