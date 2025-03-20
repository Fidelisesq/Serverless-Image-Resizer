const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const s3 = new S3Client({ region: "us-east-1" });
const INPUT_BUCKET = process.env.INPUT_BUCKET;
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET;

exports.handler = async (event) => {
    try {
        for (const record of event.Records) {
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

            const originalImage = await s3.send(new GetObjectCommand({ Bucket: INPUT_BUCKET, Key: key }));

            const sizeOptions = [400, 800, 1200]; 

            for (const size of sizeOptions) {
                const resizedImage = await sharp(await originalImage.Body.transformToByteArray())
                    .resize(size, size)
                    .toBuffer();

                await s3.send(new PutObjectCommand({
                    Bucket: OUTPUT_BUCKET,
                    Key: `resized-${size}/${key}`,
                    Body: resizedImage,
                    ContentType: "image/jpeg"
                }));
            }

            console.log(`Resized and stored images for: ${key}`);
        }
    } catch (error) {
        console.error("Error resizing image:", error);
        throw error;
    }
};
