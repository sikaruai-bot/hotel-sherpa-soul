import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Allowed MIME types for PMS (Photos & Videos)
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided in the request.' },
        { status: 400 }
      );
    }

    // 1. Validation: File size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum limit of 50MB.' },
        { status: 400 }
      );
    }

    // 2. Validation: MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file format (${file.type}). Allowed formats: JPG, PNG, WebP, GIF, MP4, WebM, MOV.`,
        },
        { status: 400 }
      );
    }

    // 3. Ensure uploads folder exists in /public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // 4. Generate unique, safe file name
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}-${cleanFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // 5. Convert File to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;
    const isVideo = file.type.startsWith('video/');

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        fileName: uniqueFileName,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        mediaType: isVideo ? 'video' : 'image',
      },
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
