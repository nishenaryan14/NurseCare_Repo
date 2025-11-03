import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
  Req,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.userId;
    const conversationId = req.body.conversationId
      ? parseInt(req.body.conversationId)
      : undefined;

    const uploadedFile = await this.filesService.uploadFile(
      file,
      userId,
      conversationId,
    );

    return {
      success: true,
      file: {
        id: uploadedFile.id,
        filename: uploadedFile.filename,
        mimetype: uploadedFile.mimetype,
        size: uploadedFile.size,
        createdAt: uploadedFile.createdAt,
      },
    };
  }

  @Get(':id')
  async getFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const file = await this.filesService.getFile(id, userId);

    return {
      id: file.id,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy: file.uploadedBy,
      createdAt: file.createdAt,
    };
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.userId;
    const file = await this.filesService.getFile(id, userId);

    const filepath = this.filesService.getFilePath(file.storedFilename);

    if (!fs.existsSync(filepath)) {
      throw new BadRequestException('File not found on server');
    }

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  }

  @Get('conversation/:conversationId')
  async getConversationFiles(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const files = await this.filesService.getConversationFiles(
      conversationId,
      userId,
    );

    return {
      success: true,
      files: files.map((f) => ({
        id: f.id,
        filename: f.filename,
        mimetype: f.mimetype,
        size: f.size,
        uploadedBy: f.uploadedBy,
        createdAt: f.createdAt,
      })),
    };
  }

  @Delete(':id')
  async deleteFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.filesService.deleteFile(id, userId);
  }
}
