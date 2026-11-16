import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DiagnosisJob } from '../../diagnosis/entities/diagnosis-job.entity';

@Entity('image_uploads')
export class ImageUpload {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Original client filename (metadata only; storage path TBD). */
  @Column({ type: 'varchar', length: 512 })
  originalFilename!: string;

  /** MIME type, e.g. image/jpeg, image/png. */
  @Column({ type: 'varchar', length: 128 })
  contentType!: string;

  /** Object-storage key or local path once uploads are wired. */
  @Column({ type: 'varchar', length: 1024, nullable: true })
  storageKey!: string | null;

  @Column({ type: 'bigint', nullable: true })
  byteSize!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksumSha256!: string | null;

  @OneToMany(() => DiagnosisJob, (job) => job.imageUpload)
  diagnosisJobs!: DiagnosisJob[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
