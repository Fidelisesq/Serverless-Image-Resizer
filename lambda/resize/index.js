const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

const s3 = new S3Client({ region: "us-east-1" });
const INPUT_BUCKET = process.env.INPUT_BUCKET;
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET;

exports.handler = async (event) => {
    try {
        for (const record of event.Records) {
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
            console.log(`🔄 Processing uploaded file: ${key}`);

            const getObj = await s3.send(new GetObjectCommand({
                Bucket: INPUT_BUCKET,
                Key: key
            }));

            const metadata = getObj.Metadata || {};
            console.log("📦 Metadata from S3:", metadata);

            const resizeSize = metadata["resize-size"];
            if (!resizeSize || !resizeSize.includes("x")) {
                console.warn(`⚠️ Missing or invalid resize-size metadata for ${key}. Skipping.`);
                continue;
            }

            const [width, height] = resizeSize.split("x").map(Number);
            if (!width || !height) {
                console.warn(`⚠️ Invalid dimensions parsed from metadata: ${resizeSize}`);
                continue;
            }

            const imageBuffer = await getObj.Body.transformToByteArray();
            const resizedBuffer = await sharp(imageBuffer)
                .resize(width, height)
                .toBuffer();

            const outputKey = `resized-${width}x${height}/${key}`;

            await s3.send(new PutObjectCommand({
                Bucket: OUTPUT_BUCKET,
                Key: outputKey,
                Body: resizedBuffer,
                ContentType: "image/jpeg"
            }));

            console.log(`✅ Resized ${key} → ${outputKey}`);
        }
    } catch (err) {
        console.error("❌ Resize Lambda error:", err);
        throw err;
    }
};
