import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvResult } from '../diagnosis/entities/cv-result.entity';
import { DiagnosisJob } from '../diagnosis/entities/diagnosis-job.entity';
import { LlmResponse } from '../diagnosis/entities/llm-response.entity';
import { RagCitation } from '../diagnosis/entities/rag-citation.entity';
import { ImageUpload } from '../uploads/entities/image-upload.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ssl = config.get<boolean>('database.ssl');
        return {
          type: 'postgres' as const,
          host: config.get<string>('database.host'),
          port: config.get<number>('database.port'),
          username: config.get<string>('database.username'),
          password: config.get<string>('database.password'),
          database: config.get<string>('database.name'),
          entities: [
            ImageUpload,
            DiagnosisJob,
            CvResult,
            RagCitation,
            LlmResponse,
          ],
          // Dev-only auto-schema. Use migrations before production deploys.
          synchronize: config.get<string>('nodeEnv') !== 'production',
          // AWS RDS expects TLS; pin the RDS CA in a later hardening pass.
          ssl: ssl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
