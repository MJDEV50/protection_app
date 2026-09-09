import OpenAI from 'openai';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function generateAvatar(
  imageBuffer: Buffer,
  vibeDescription: string,
  userId: string
): Promise<{ avatarUrl: string; avatarId: string }> {
  try {
    // Resize image to 512x512
    const resizedImage = await sharp(imageBuffer)
      .resize(512, 512, { fit: 'cover' })
      .png()
      .toBuffer();

    logger.info(`Generating avatar for user ${userId}...`);

    // Generate avatar prompt with DALL-E 3
    const avatarPrompt = `Create an illustrated avatar for a women's safety app based on this vibe: "${vibeDescription}"

Requirements:
- Modern, empowering illustrated style (NOT photorealistic)
- Diverse representation of women
- Include purple (#4D3FA0) and pink (#E63946) accents
- Professional yet approachable
- Shows confidence and strength
- Friendly appearance
- Elements representing their vibe

Make it unique, empowering, and professional.`;

    // Generate image with DALL-E 3
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: avatarPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
    });

    if (!imageResponse.data[0].url) {
      throw new Error('Failed to generate avatar image');
    }

    // Download the generated image
    const imageUrl = imageResponse.data[0].url;
    const fetch = require('node-fetch');
    const response = await fetch(imageUrl);
    const avatarBuffer = await response.buffer();

    // Upload to S3
    const avatarId = uuidv4();
    const s3Key = `avatars/${userId}/${avatarId}.png`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || 'refuge-media',
        Key: s3Key,
        Body: avatarBuffer,
        ContentType: 'image/png',
      })
    );

    const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    logger.info(`✓ Avatar generated: ${s3Url}`);

    return {
      avatarUrl: s3Url,
      avatarId,
    };
  } catch (error: any) {
    logger.error('Avatar generation error:', error);
    throw error;
  }
}
