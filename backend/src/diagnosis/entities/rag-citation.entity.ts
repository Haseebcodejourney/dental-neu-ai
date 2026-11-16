import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DiagnosisJob } from './diagnosis-job.entity';

@Entity('rag_citations')
export class RagCitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  diagnosisJobId!: string;

  @ManyToOne(() => DiagnosisJob, (job) => job.ragCitations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diagnosisJobId' })
  diagnosisJob!: DiagnosisJob;

  /** Disease class used for class-aligned retrieval. */
  @Column({ type: 'varchar', length: 256 })
  diseaseClass!: string;

  @Column({ type: 'varchar', length: 512 })
  sourceDocument!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  pageOrSection!: string | null;

  @Column({ type: 'text' })
  passage!: string;

  @Column({ type: 'double precision', nullable: true })
  relevanceScore!: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
