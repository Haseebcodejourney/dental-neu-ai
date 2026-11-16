import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvResult } from '../diagnosis/entities/cv-result.entity';
import { DiagnosisJob } from '../diagnosis/entities/diagnosis-job.entity';
import { LlmResponse } from '../diagnosis/entities/llm-response.entity';
import { RagCitation } from '../diagnosis/entities/rag-citation.entity';
import { ImageUpload } from '../uploads/entities/image-upload.entity';
import { shouldSynchronizeSchema } from './database-name';
import { ensureDatabaseExists } from './ensure-database';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const ssl = config.get<boolean>('database.ssl') === true;
        const host = config.getOrThrow<string>('database.host');
        const port = config.getOrThrow<number>('database.port');
        const username = config.getOrThrow<string>('database.username');
        const password = config.getOrThrow<string>('database.password');
        const database = config.getOrThrow<string>('database.name');
        const ensure = config.get<boolean>('database.ensure') !== false;

        if (ensure) {
          await ensureDatabaseExists({
            host,
            port,
            user: username,
            password,
            database,
            ssl,
            maintenanceDatabase: config.get<string>(
              'database.maintenanceName',
              'postgres',
            ),
          });
        }

        const synchronize = shouldSynchronizeSchema(
          config.get<string>('nodeEnv'),
          config.get<boolean>('syncSchema') === true,
        );

        return {
          type: 'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          entities: [
            ImageUpload,
            DiagnosisJob,
            CvResult,
            RagCitation,
            LlmResponse,
          ],
          // Dev: on. Production: off unless SYNC_SCHEMA=true (first Aurora boot).
          // Prefer TypeORM migrations for ongoing production schema changes.
          synchronize,
          // Aurora/RDS TLS; pin the AWS RDS CA in a later hardening pass.
          ssl: ssl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
