const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "us-east-1" });
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
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

    return new Promise((resolve, reject) => {
        s3.createPresignedPost(params, (err, signedUrl) => {
            if (err) {
                console.error("Error generating presigned URL:", err);
                reject({
                    statusCode: 500,
                    body: JSON.stringify({ error: "Internal Server Error" })
                });
            } else {
                resolve({
                    statusCode: 200,
                    body: JSON.stringify({
                        url: signedUrl.url,
                        fields: signedUrl.fields
                    })
                });
            }
        });
    });
};
