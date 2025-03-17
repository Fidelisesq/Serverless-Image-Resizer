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
            Fields: { key: `uploads/${fileName}` }, // Corrected format
            Conditions: [
                ["starts-with", "$key", "uploads/"], // Ensures key starts with "uploads/"
                { bucket: BUCKET_NAME },
                { acl: "private" } // Fixing condition format
            ],
            Expires: 300 // Expiry time for the presigned URL
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
                            fields: signedUrl.fields,
                            resizeOption: resizeOption
                        })
                    });
                }
            });
        });

    } catch (error) {
        console.error("Unexpected error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
    }
};
