/**
 * Video Analyzer - Extracts frames from video and analyzes them with Gemini AI
 * For transcription and product detail extraction from video content
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AnalysisResult {
  title: string;
  description: string;
  category: string;
  condition: string;
  suggestedPrice?: number;
  brand?: string;
  tags?: string[];
  sellerName?: string;
  sellerEmail?: string;
  sellerLocation?: string;
  sellerPhone?: string;
  confidence?: number;
  transcription?: string;
}

export interface VideoAnalysisResult {
  frames: string[]; // Base64 encoded frames
  analysis: AnalysisResult | null;
  error?: string;
}

/**
 * Extract frames from video at specified intervals
 * @param videoFile - The video file to extract frames from
 * @param frameCount - Number of frames to extract (default: 3)
 * @returns Array of base64 encoded frame images
 */
export async function extractVideoFrames(
  videoFile: File,
  frameCount: number = 3
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const frames: string[] = [];
    let framesExtracted = 0;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = video.duration;
      const interval = duration / (frameCount + 1);

      const extractFrame = (index: number) => {
        if (index > frameCount) {
          resolve(frames);
          return;
        }

        video.currentTime = interval * index;
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        frames.push(base64.split(',')[1]); // Extract only the base64 part
        framesExtracted++;
        extractFrame(framesExtracted);
      };

      extractFrame(1);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    const url = URL.createObjectURL(videoFile);
    video.src = url;
  });
}

/**
 * Analyze video by extracting frames and sending them to Gemini AI
 * Uses Google Generative AI to extract seller info and product details
 * @param videoFile - The video file to analyze
 * @returns Analysis result with seller details and product information
 */
export async function analyzeVideo(videoFile: File): Promise<VideoAnalysisResult> {
  try {
    const frames = await extractVideoFrames(videoFile, 3);
    
    if (!frames || frames.length === 0) {
      return {
        frames: [],
        analysis: null,
        error: 'No frames extracted from video',
      };
    }

    // Use the first frame for detailed analysis
    const primaryFrame = frames[0];
    
    try {
      const analysis = await analyzeFrameWithGemini(primaryFrame);
      return {
        frames,
        analysis,
      };
    } catch (error) {
      return {
        frames,
        analysis: null,
        error: error instanceof Error ? error.message : 'Failed to analyze video frames',
      };
    }
  } catch (error) {
    return {
      frames: [],
      analysis: null,
      error: error instanceof Error ? error.message : 'Failed to extract video frames',
    };
  }
}

/**
 * Analyze a single frame using Google Gemini AI
 * @param base64Frame - Base64 encoded frame image
 * @returns Extracted product and seller information
 */
async function analyzeFrameWithGemini(base64Frame: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert product lister assistant. Analyze this image from a product video/listing and extract the following information:

1. Product Title - Clear, concise product name
2. Description - Detailed description of the product's features, condition, and usage
3. Category - Product category (e.g., Electronics, Furniture, Clothing, etc.)
4. Condition - Product condition (Like New, Excellent, Good, Fair, Poor)
5. Suggested Price - Estimate a fair market price
6. Brand - Product brand if identifiable
7. Tags - Relevant tags/keywords (comma-separated)
8. Seller Information (if visible in video):
   - Seller Name: Full name if shown or speaker identified
   - Seller Email: Email if visible (extract carefully)
   - Seller Location: Location/region if mentioned
   - Seller Phone: Phone number if visible
9. Transcription: Any spoken text or visible text in the image
10. Confidence: Your confidence level (0-100) in the extracted information

Return ONLY a valid JSON object:
{
  "title": "string",
  "description": "string", 
  "category": "string",
  "condition": "string",
  "suggestedPrice": number,
  "brand": "string",
  "tags": ["string"],
  "sellerName": "string",
  "sellerEmail": "string",
  "sellerLocation": "string",
  "sellerPhone": "string",
  "transcription": "string",
  "confidence": number
}`;

  const response = await model.generateContent([
    {
      inlineData: {
        data: base64Frame,
        mimeType: 'image/jpeg',
      },
    },
    {
      text: prompt,
    },
  ]);

  const text = response.response.text();

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON');
  }

  const result = JSON.parse(jsonMatch[0]) as AnalysisResult;
  return result;
}

/**
 * Batch analyze multiple images for seller auto-fill
 * Extracts seller context from images (name tags, signs, etc.)
 * @param files - Array of image files
 * @returns Analysis results for seller auto-fill
 */
export async function analyzeImagesForSellerInfo(files: File[]): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  for (const file of files.slice(0, 2)) { // Analyze first 2 images
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const analysis = await analyzeFrameWithGemini(base64);
      results.push(analysis);
    } catch (error) {
      console.error('[v0] Error analyzing image for seller info:', error);
    }
  }

  return results;
}
