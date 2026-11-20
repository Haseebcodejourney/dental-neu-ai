import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MlClientService } from '../ml/ml-client.service';
import { ImageUpload } from '../uploads/entities/image-upload.entity';
import { CvResult } from './entities/cv-result.entity';
import {
  DiagnosisJob,
  DiagnosisJobStatus,
} from './entities/diagnosis-job.entity';
import { LlmResponse } from './entities/llm-response.entity';
import { RagCitation } from './entities/rag-citation.entity';

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectRepository(ImageUpload)
    private readonly uploads: Repository<ImageUpload>,
    @InjectRepository(DiagnosisJob)
    private readonly jobs: Repository<DiagnosisJob>,
    @InjectRepository(CvResult)
    private readonly cvResults: Repository<CvResult>,
    @InjectRepository(RagCitation)
    private readonly citations: Repository<RagCitation>,
    @InjectRepository(LlmResponse)
    private readonly llmResponses: Repository<LlmResponse>,
    private readonly ml: MlClientService,
  ) {}

  async runStubPipeline(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('image file is required');
    }

    const upload = await this.uploads.save(
      this.uploads.create({
        originalFilename: file.originalname || 'upload.bin',
        contentType: file.mimetype || 'application/octet-stream',
        storageKey: null,
        byteSize: String(file.size),
        checksumSha256: null,
      }),
    );

    const job = await this.jobs.save(
      this.jobs.create({
        imageUploadId: upload.id,
        status: DiagnosisJobStatus.RUNNING,
        errorMessage: null,
      }),
    );

    try {
      const classification = await this.ml.classify(
        file.buffer,
        file.originalname || 'upload.bin',
        file.mimetype || 'application/octet-stream',
      );

      const diagnosis = await this.ml.diagnose(classification.class, upload.id);

      const cv = await this.cvResults.save(
        this.cvResults.create({
          diagnosisJobId: job.id,
          predictedClass: classification.class,
          confidence: classification.confidence,
          modelName: classification.model,
          modelVersion: null,
          rawOutput: null,
        }),
      );

      const savedCitations = await this.citations.save(
        diagnosis.citations.map((c) =>
          this.citations.create({
            diagnosisJobId: job.id,
            diseaseClass: classification.class,
            sourceDocument: c.source,
            pageOrSection: c.page_or_section,
            passage: c.passage,
            relevanceScore: c.relevance_score,
          }),
        ),
      );

      const llm = await this.llmResponses.save(
        this.llmResponses.create({
          diagnosisJobId: job.id,
          diagnosisText: diagnosis.diagnosis,
          modelName: diagnosis.model,
          modelVersion: null,
          structuredPayload: null,
        }),
      );

      job.status = DiagnosisJobStatus.SUCCEEDED;
      await this.jobs.save(job);

      return {
        jobId: job.id,
        imageUploadId: upload.id,
        status: job.status,
        classification: {
          class: cv.predictedClass,
          confidence: cv.confidence,
          model: cv.modelName,
          detections: classification.detections ?? [],
        },
        diagnosis: {
          text: llm.diagnosisText,
          model: llm.modelName,
          citations: savedCitations.map((c) => ({
            source: c.sourceDocument,
            pageOrSection: c.pageOrSection,
            passage: c.passage,
            relevanceScore: c.relevanceScore,
          })),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      job.status = DiagnosisJobStatus.FAILED;
      job.errorMessage = message;
      await this.jobs.save(job);
      throw new ServiceUnavailableException(message);
    }
  }
}
