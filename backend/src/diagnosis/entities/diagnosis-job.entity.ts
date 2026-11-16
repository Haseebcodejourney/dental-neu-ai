import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ImageUpload } from '../../uploads/entities/image-upload.entity';
import { CvResult } from './cv-result.entity';
import { LlmResponse } from './llm-response.entity';
import { RagCitation } from './rag-citation.entity';

export enum DiagnosisJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

@Entity('diagnosis_jobs')
export class DiagnosisJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  imageUploadId!: string;

  @ManyToOne(() => ImageUpload, (upload) => upload.diagnosisJobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'imageUploadId' })
  imageUpload!: ImageUpload;

  @Column({
    type: 'enum',
    enum: DiagnosisJobStatus,
    default: DiagnosisJobStatus.PENDING,
  })
  status!: DiagnosisJobStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @OneToOne(() => CvResult, (cv) => cv.diagnosisJob)
  cvResult!: CvResult | null;

  @OneToMany(() => RagCitation, (citation) => citation.diagnosisJob)
  ragCitations!: RagCitation[];

  @OneToOne(() => LlmResponse, (llm) => llm.diagnosisJob)
  llmResponse!: LlmResponse | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
