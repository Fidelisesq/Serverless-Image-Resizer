const AWS = require("aws-sdk");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
    try {
        const queryParams = event.queryStringParameters || {};
        const fileName = queryParams.name;

        if (!fileName) {
            return { statusCode: 400, body: JSON.stringify({ message: "Missing file name" }) };
        }

        await s3.deleteObject({ Bucket: BUCKET_NAME, Key: fileName }).promise();

        return { statusCode: 200, body: JSON.stringify({ message: "Image deleted successfully" }) };
    } catch (error) {
        console.error("Error deleting image:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
    }
};
