import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DiagnosisJob } from './diagnosis-job.entity';

@Entity('llm_responses')
export class LlmResponse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  diagnosisJobId!: string;

  @OneToOne(() => DiagnosisJob, (job) => job.llmResponse, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diagnosisJobId' })
  diagnosisJob!: DiagnosisJob;

  /** Structured diagnostic narrative from the LLM (grounded on CV + RAG). */
  @Column({ type: 'text' })
  diagnosisText!: string;

  @Column({ type: 'varchar', length: 128 })
  modelName!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  modelVersion!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  structuredPayload!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
