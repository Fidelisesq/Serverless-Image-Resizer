const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const s3 = new S3Client({ region: "us-east-1" });
const INPUT_BUCKET = process.env.INPUT_BUCKET;
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET;

exports.handler = async (event) => {
    try {
        for (const record of event.Records) {
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

            console.log(`🔄 Processing file: ${key}`);

            // Get original image with metadata
            const getObjectResponse = await s3.send(new GetObjectCommand({
                Bucket: INPUT_BUCKET,
                Key: key
            }));

            const metadata = getObjectResponse.Metadata || {};
            const resizeSize = metadata["resize-size"]; // metadata keys are lowercased

            console.log("📦 Metadata:", metadata);

            if (!resizeSize || !resizeSize.includes("x")) {
                console.warn(`⚠️ No valid resize metadata found for ${key}. Skipping.`);
                continue;
            }

            const [width, height] = resizeSize.split("x").map(Number);
            if (!width || !height) {
                console.warn(`⚠️ Invalid resize dimensions in metadata: ${resizeSize}`);
                continue;
            }

            console.log(`📐 Resizing to: ${width}x${height}`);

            // Resize using sharp
            const buffer = await getObjectResponse.Body.transformToByteArray();
            const resizedImage = await sharp(buffer)
                .resize(width, height)
                .toBuffer();

            const outputKey = `resized-${width}x${height}/${key}`;

            await s3.send(new PutObjectCommand({
                Bucket: OUTPUT_BUCKET,
                Key: outputKey,
                Body: resizedImage,
                ContentType: "image/jpeg"
            }));

            console.log(`✅ Resized ${key} → ${outputKey}`);
        }
    } catch (error) {
        console.error("❌ Resize Lambda error:", error);
        throw error;
    }
};
