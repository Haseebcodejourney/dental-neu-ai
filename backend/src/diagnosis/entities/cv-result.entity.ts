import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DiagnosisJob } from './diagnosis-job.entity';

@Entity('cv_results')
export class CvResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  diagnosisJobId!: string;

  @OneToOne(() => DiagnosisJob, (job) => job.cvResult, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diagnosisJobId' })
  diagnosisJob!: DiagnosisJob;

  /** Predicted disease class aligned to the labeled dataset. */
  @Column({ type: 'varchar', length: 256 })
  predictedClass!: string;

  @Column({ type: 'double precision' })
  confidence!: number;

  /** Model identifier, e.g. yolo-v8-dental. */
  @Column({ type: 'varchar', length: 128 })
  modelName!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  modelVersion!: string | null;

  /** Optional detection boxes / heatmaps as JSON once CV is wired. */
  @Column({ type: 'jsonb', nullable: true })
  rawOutput!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
