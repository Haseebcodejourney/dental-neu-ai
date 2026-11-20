import type { DiagnosisRunResponse } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export async function runDiagnosis(file: File): Promise<DiagnosisRunResponse> {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${API_BASE}/api/diagnosis/run`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        detail = body.message.join(", ");
      } else if (body.message) {
        detail = body.message;
      }
    } catch {
      /* keep statusText */
    }
    throw new Error(detail || `Diagnosis failed (${res.status})`);
  }

  return (await res.json()) as DiagnosisRunResponse;
}
