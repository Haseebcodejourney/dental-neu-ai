import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DiagnosisService } from './diagnosis.service';

@Controller('diagnosis')
export class DiagnosisController {
  constructor(private readonly diagnosis: DiagnosisService) {}

  @Get()
  listStub() {
    return {
      message:
        'POST /api/diagnosis/run with multipart field "image" to run CV → RAG → diagnose.',
    };
  }

  /** Orchestration: record job → ML classify → ML diagnose (RAG + Claude/stub) → persist. */
  @Post('run')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  run(@UploadedFile() file: Express.Multer.File) {
    return this.diagnosis.runStubPipeline(file);
  }
}
