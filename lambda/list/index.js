const AWS = require("aws-sdk");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async () => {
    try {
        const data = await s3.listObjectsV2({ Bucket: BUCKET_NAME }).promise();
        const images = data.Contents.map((item) => ({
            Name: item.Key,
            URL: `https://${BUCKET_NAME}.s3.amazonaws.com/${item.Key}`
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(images)
        };
    } catch (error) {
        console.error("Error listing images:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
    }
};
