import { Controller, Get } from '@nestjs/common';

/**
 * Stub: diagnosis jobs API (CV → RAG → LLM pipeline orchestration).
 * Entities exist; job queue and AI integrations come later.
 */
@Controller('diagnosis')
export class DiagnosisController {
  @Get()
  listStub() {
    return {
      message:
        'Diagnosis module stub — job/CV/RAG/LLM entities ready; pipeline not implemented yet.',
    };
  }
}
