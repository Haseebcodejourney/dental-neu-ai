import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageUpload } from './entities/image-upload.entity';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ImageUpload])],
  controllers: [UploadsController],
  exports: [TypeOrmModule],
})
export class UploadsModule {}
