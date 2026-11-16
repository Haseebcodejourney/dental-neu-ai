import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosisController } from './diagnosis.controller';
import { CvResult } from './entities/cv-result.entity';
import { DiagnosisJob } from './entities/diagnosis-job.entity';
import { LlmResponse } from './entities/llm-response.entity';
import { RagCitation } from './entities/rag-citation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiagnosisJob,
      CvResult,
      RagCitation,
      LlmResponse,
    ]),
  ],
  controllers: [DiagnosisController],
  exports: [TypeOrmModule],
})
export class DiagnosisModule {}
