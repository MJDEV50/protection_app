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
    // Resize image to 512x512 for DALL-E
    const resizedImage = await sharp(imageBuffer)
      .resize(512, 512, { fit: 'cover' })
      .png()
      .toBuffer();

    // Convert to base64
    const base64Image = resizedImage.toString('base64');

    logger.info(`Generating avatar for user ${userId}...`);

    // Call DALL-E 3 API with vision
    const message = await openai.messages.create({
      model: 'gpt-4-vision-preview',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `You are an avatar designer for a women's safety app. 
              
Create an illustrated avatar based on this user photo and their vibe: "${vibeDescription}"

Requirements:
- Modern, empowering illustrated style (NOT photorealistic)
- Diverse representation of women (ethnicity, body type, style)
- Include purple (#4D3FA0) and pink (#E63946) color accents
- Professional yet approachable
- Shows confidence and strength
- Friendly and welcoming appearance
- Include elements that represent their vibe (sports, hobbies, style, etc.)

Return a detailed description for DALL-E 3 to generate this avatar image. Be specific about:
- Art style (illustration style description)
- Character features (based on the photo)
- Clothing/style elements (representing their vibe)
- Colors (incorporate purple and pink)
- Pose and expression
- Background (simple, professional)`,
            },
          ],
        },
      ],
    });

    const avatarPrompt = message.content[0].type === 'text' ? message.content[0].text : '';
    
    logger.info(`Avatar prompt generated, calling DALL-E 3...`);

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

    // Download the image from DALL-E
    const imageUrl = imageResponse.data[0].url;
    const fetch = (await import('node-fetch')).default;
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
        Metadata: {
          userId,
          vibeDescription,
          generatedAt: new Date().toISOString(),
        },
      })
    );

    const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    logger.info(`✓ Avatar generated and stored: ${s3Url}`);

    return {
      avatarUrl: s3Url,
      avatarId,
    };
  } catch (error: any) {
    logger.error('Avatar generation error:', error);
    throw error;
  }
}
