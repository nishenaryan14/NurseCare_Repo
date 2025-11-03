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
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import type { Response } from 'express';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
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
        url: uploadedFile.filepath,
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
      url: file.filepath,
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

    // Redirect to Cloudinary URL
    res.redirect(file.filepath);
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
        url: f.filepath,
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
