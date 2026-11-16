import { Controller, Get } from '@nestjs/common';

/**
 * Stub: image upload metadata API.
 * Entities exist; upload storage and multipart handling come later.
 */
@Controller('uploads')
export class UploadsController {
  @Get()
  listStub() {
    return {
      message:
        'Uploads module stub — metadata entity ready; API not implemented yet.',
    };
  }
}
