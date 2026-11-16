import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MlClientService } from '../ml/ml-client.service';
import { ImageUpload } from '../uploads/entities/image-upload.entity';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';
import { CvResult } from './entities/cv-result.entity';
import { DiagnosisJob } from './entities/diagnosis-job.entity';
import { LlmResponse } from './entities/llm-response.entity';
import { RagCitation } from './entities/rag-citation.entity';

@Module({
  imports: [
    HttpModule.register({ timeout: 60_000 }),
    TypeOrmModule.forFeature([
      ImageUpload,
      DiagnosisJob,
      CvResult,
      RagCitation,
      LlmResponse,
    ]),
  ],
  controllers: [DiagnosisController],
  providers: [DiagnosisService, MlClientService],
  exports: [TypeOrmModule],
})
export class DiagnosisModule {}
