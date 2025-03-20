const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
    try {
        const queryParams = event.queryStringParameters || {};
        const fileName = queryParams.fileName; // Consistency with presign

        if (!fileName) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Missing fileName parameter" })
            };
        }

        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: fileName }));

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Image deleted successfully" })
        };
    } catch (error) {
        console.error("Error deleting image:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Internal Server Error", details: error.message })
        };
    }
};
