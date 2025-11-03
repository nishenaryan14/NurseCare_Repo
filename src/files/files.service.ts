import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: number,
    conversationId?: number,
  ) {
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(this.uploadDir, filename);

    try {
      await writeFile(filepath, file.buffer);

      const fileRecord = await this.prisma.file.create({
        data: {
          filename: file.originalname,
          storedFilename: filename,
          filepath: filepath,
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
      // Delete physical file
      await unlink(file.filepath);
    } catch (error) {
      console.error('Failed to delete physical file:', error);
    }

    // Delete database record
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    return { message: 'File deleted successfully' };
  }

  getFilePath(storedFilename: string): string {
    return path.join(this.uploadDir, storedFilename);
  }
}
