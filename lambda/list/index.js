const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async () => {
    try {
        const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
        const data = await s3.send(command);

        const images = (data.Contents || []).map((item) => ({
            Name: item.Key,
            URL: `https://${BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
            LastModified: item.LastModified
                ? new Date(item.LastModified).toISOString()
                : null
        }));

        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*", 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(images)
        };
    } catch (error) {
        console.error("Error listing images:", error);
        return {
            statusCode: 500,
            headers: { 
                "Access-Control-Allow-Origin": "*", 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ error: "Internal Server Error", details: error.message })
        };
    }
};
