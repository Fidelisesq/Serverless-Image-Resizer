const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const s3 = new S3Client({ region: "us-east-1" });
const INPUT_BUCKET = process.env.INPUT_BUCKET;
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET;

exports.handler = async (event) => {
    try {
        for (const record of event.Records) {
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

            // Fetch original object and metadata
            const { Body, Metadata } = await s3.send(
                new GetObjectCommand({ Bucket: INPUT_BUCKET, Key: key })
            );

            const resizeSize = Metadata["resize-size"]; // key will be lowercase by default in AWS

            if (!resizeSize || !resizeSize.includes("x")) {
                console.warn(`No valid resize metadata found for ${key}. Skipping.`);
                continue;
            }

            const [width, height] = resizeSize.split("x").map(Number);

            if (!width || !height) {
                console.warn(`Invalid resize dimensions provided for ${key}: ${resizeSize}`);
                continue;
            }

            const resizedImage = await sharp(await Body.transformToByteArray())
                .resize(width, height)
                .toBuffer();

            const outputKey = `resized-${width}x${height}/${key}`;

            await s3.send(new PutObjectCommand({
                Bucket: OUTPUT_BUCKET,
                Key: outputKey,
                Body: resizedImage,
                ContentType: "image/jpeg"
            }));

            console.log(`✅ Resized ${key} to ${width}x${height} → ${outputKey}`);
        }
    } catch (error) {
        console.error("❌ Error resizing image:", error);
        throw error;
    }
};
