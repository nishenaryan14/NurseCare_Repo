import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: number,
    conversationId?: number,
  ) {
    try {
      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'nursecare-files',
            resource_type: 'auto',
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });

      const cloudinaryResult = uploadResult as any;

      // Save to database
      const fileRecord = await this.prisma.file.create({
        data: {
          filename: file.originalname,
          storedFilename: cloudinaryResult.public_id,
          filepath: cloudinaryResult.secure_url,
          mimetype: file.mimetype,
          size: file.size,
          uploadedById: userId,
          conversationId: conversationId,
        },
      });

      return fileRecord;
    } catch (error) {
      console.error('File upload error:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async getFile(fileId: number, userId: number) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check if user has access to this file
    if (file.conversationId) {
      const hasAccess = file.conversation.participants.some(
        (p) => p.userId === userId,
      );
      if (!hasAccess) {
        throw new BadRequestException('You do not have access to this file');
      }
    } else if (file.uploadedById !== userId) {
      throw new BadRequestException('You do not have access to this file');
    }

    return file;
  }

  async getConversationFiles(conversationId: number, userId: number) {
    // Verify user is part of conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const hasAccess = conversation.participants.some((p) => p.userId === userId);
    if (!hasAccess) {
      throw new BadRequestException('You do not have access to this conversation');
    }

    return this.prisma.file.findMany({
      where: { conversationId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFile(fileId: number, userId: number) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.uploadedById !== userId) {
      throw new BadRequestException('You can only delete your own files');
    }

    try {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(file.storedFilename);
    } catch (error) {
      console.error('Failed to delete file from Cloudinary:', error);
    }

    // Delete database record
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    return { message: 'File deleted successfully' };
  }

  getFileUrl(filepath: string): string {
    return filepath; // Already a Cloudinary URL
  }
}
