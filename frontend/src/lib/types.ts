export type Detection = {
  class: string;
  confidence: number;
  bbox: number[];
};

export type DiagnosisCitation = {
  source: string;
  pageOrSection: string | null;
  passage: string;
  relevanceScore: number | null;
};

export type DiagnosisRunResponse = {
  jobId: string;
  imageUploadId: string;
  status: string;
  classification: {
    class: string;
    confidence: number;
    model: string;
    detections: Detection[];
  };
  diagnosis: {
    text: string;
    model: string;
    citations: DiagnosisCitation[];
  };
};
