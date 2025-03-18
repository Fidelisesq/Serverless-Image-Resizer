import { S3Client, CreatePresignedPostCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const queryParams = event.queryStringParameters || {};
    const fileName = queryParams.fileName;

    if (!fileName) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing fileName" }) };
    }

    const params = {
        Bucket: BUCKET_NAME,
        Fields: { key: `uploads/${fileName}` },
        Conditions: [
            ["starts-with", "$key", "uploads/"],
            { bucket: BUCKET_NAME }
        ],
        Expires: 300
    };

    try {
        const command = new CreatePresignedPostCommand(params);
        const signedUrl = await s3.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify({
                url: signedUrl.url,
                fields: signedUrl.fields
            })
        };
    } catch (err) {
        console.error("Error generating presigned URL:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};
