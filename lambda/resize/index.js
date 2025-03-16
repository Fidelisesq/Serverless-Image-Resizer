const AWS = require("aws-sdk");
const sharp = require("sharp");

const s3 = new AWS.S3();
const INPUT_BUCKET = process.env.INPUT_BUCKET;
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET;

exports.handler = async (event) => {
    try {
        for (const record of event.Records) {
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
            const sizeOptions = [400, 800, 1200]; // Resize options

            const originalImage = await s3.getObject({ Bucket: INPUT_BUCKET, Key: key }).promise();

            for (const size of sizeOptions) {
                const resizedImage = await sharp(originalImage.Body).resize(size, size).toBuffer();

                await s3.putObject({
                    Bucket: OUTPUT_BUCKET,
                    Key: `resized-${size}/${key}`,
                    Body: resizedImage,
                    ContentType: "image/jpeg"
                }).promise();
            }

            console.log(`Resized and stored images for: ${key}`);
        }
    } catch (error) {
        console.error("Error resizing image:", error);
        throw error;
    }
};
