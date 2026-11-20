import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import FormData from 'form-data';
import { firstValueFrom } from 'rxjs';

export type Detection = {
  class: string;
  confidence: number;
  /** Absolute xyxy pixel coords [x1, y1, x2, y2] */
  bbox: number[];
};

export type ClassifyResult = {
  class: string;
  confidence: number;
  model: string;
  detections?: Detection[];
};

export type DiagnoseCitation = {
  source: string;
  page_or_section: string | null;
  passage: string;
  relevance_score: number | null;
};

export type DiagnoseResult = {
  diagnosis: string;
  citations: DiagnoseCitation[];
  model: string;
};

@Injectable()
export class MlClientService {
  private readonly logger = new Logger(MlClientService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.get<string>('mlServiceUrl', 'http://localhost:8000');
  }

  async classify(
    imageBuffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<ClassifyResult> {
    const form = new FormData();
    form.append('image', imageBuffer, {
      filename,
      contentType,
    });

    try {
      const { data } = await firstValueFrom(
        this.http.post<ClassifyResult>(`${this.baseUrl}/classify`, form, {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
        }),
      );
      return data;
    } catch (err) {
      this.rethrow('classify', err);
    }
  }

  async diagnose(
    predictedClass: string,
    imageId?: string,
  ): Promise<DiagnoseResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<DiagnoseResult>(`${this.baseUrl}/diagnose`, {
          class: predictedClass,
          image_id: imageId ?? null,
        }),
      );
      return data;
    } catch (err) {
      this.rethrow('diagnose', err);
    }
  }

  private rethrow(op: string, err: unknown): never {
    const axiosErr = err as AxiosError;
    const detail =
      axiosErr.response?.data !== undefined
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
    this.logger.error(`ML ${op} failed: ${detail}`);
    throw new Error(`ML service ${op} failed: ${detail}`);
  }
}
