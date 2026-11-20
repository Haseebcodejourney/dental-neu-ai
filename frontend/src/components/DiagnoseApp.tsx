"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { runDiagnosis } from "@/lib/api";
import type { DiagnosisRunResponse } from "@/lib/types";
import { DetectionOverlay } from "./DetectionOverlay";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function formatPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function DiagnoseApp() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisRunResponse | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFileName(null);
    setNaturalSize({ w: 0, h: 0 });
    setResult(null);
    setError(null);
  }, []);

  const analyze = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPEG, PNG, WebP).");
      return;
    }

    setError(null);
    setResult(null);
    setFileName(file.name);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });

    setBusy(true);
    startTransition(() => {
      void (async () => {
        try {
          const data = await runDiagnosis(file);
          setResult(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Diagnosis failed");
        } finally {
          setBusy(false);
        }
      })();
    });
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyze(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) analyze(file);
  };

  const detections = result?.classification.detections ?? [];
  const loading = busy || pending;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
      <header className="animate-fade-up mb-10 sm:mb-14">
        <p className="font-display text-[clamp(2.4rem,8vw,4.75rem)] font-semibold leading-[0.95] tracking-tight text-[var(--film)]">
          Dental NEU AI
        </p>
        <h1 className="mt-5 max-w-xl font-display text-[clamp(1.15rem,3vw,1.55rem)] font-medium leading-snug text-[var(--mist)]">
          Panoramic triage in one pass
        </h1>
        <p className="mt-3 max-w-lg text-[0.98rem] leading-relaxed text-[var(--mist-dim)]">
          Drop a panoramic radiograph. We classify via Nest → YOLO, then return
          the top class, detections, and a RAG-grounded diagnosis when configured.
        </p>
      </header>

      <section
        className={`animate-fade-up-delay relative flex min-h-[min(52vh,420px)] flex-col items-center justify-center border border-dashed transition-colors ${
          dragging
            ? "drop-active border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
            : "border-[color-mix(in_srgb,var(--mist)_28%,transparent)] bg-[color-mix(in_srgb,var(--ink-lift)_55%,transparent)]"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={onDrop}
        aria-label="Upload panoramic radiograph"
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={onFileChange}
        />

        {!previewUrl ? (
          <div className="flex flex-col items-center gap-5 px-6 py-12 text-center">
            <p className="max-w-sm text-[var(--mist)]">
              Drag a panoramic here, or choose a file from disk.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-[var(--accent)] px-6 py-3 font-display text-sm font-semibold tracking-wide text-[var(--ink)] transition hover:bg-[color-mix(in_srgb,var(--accent)_88%,white)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Upload radiograph
            </button>
          </div>
        ) : (
          <div className="relative flex w-full justify-center px-3 py-3 sm:px-5 sm:py-5">
            <div className="relative max-h-[min(56vh,520px)] max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={fileName ? `Preview of ${fileName}` : "Uploaded panoramic"}
                className="block max-h-[min(56vh,520px)] w-auto max-w-full object-contain"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setNaturalSize({
                    w: img.naturalWidth,
                    h: img.naturalHeight,
                  });
                }}
              />
              <DetectionOverlay
                detections={detections}
                naturalWidth={naturalSize.w}
                naturalHeight={naturalSize.h}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="border border-[color-mix(in_srgb,var(--mist)_35%,transparent)] px-4 py-2 text-sm text-[var(--mist)] transition hover:border-[var(--accent)] hover:text-[var(--film)] disabled:opacity-50"
              >
                Replace image
              </button>
              <button
                type="button"
                onClick={clearPreview}
                disabled={loading}
                className="px-4 py-2 text-sm text-[var(--mist-dim)] underline-offset-4 hover:text-[var(--mist)] hover:underline disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--ink)_72%,transparent)] backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
          >
            <p className="font-display text-lg tracking-wide text-[var(--accent)]">
              Running classify → diagnose…
            </p>
          </div>
        )}
      </section>

      {error && (
        <p
          className="animate-fade-up mt-6 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </p>
      )}

      {result && (
        <section
          className="animate-fade-up-delay-2 mt-12 space-y-8 border-t border-[color-mix(in_srgb,var(--mist)_18%,transparent)] pt-10"
          aria-label="Diagnosis results"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--mist-dim)]">
              Top class
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-[var(--film)] sm:text-4xl">
              {result.classification.class}
            </p>
            <p className="mt-2 text-[var(--mist)]">
              Confidence {formatPct(result.classification.confidence)} · model{" "}
              <span className="text-[var(--accent)]">
                {result.classification.model}
              </span>
            </p>
          </div>

          {detections.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--mist-dim)]">
                Detections ({detections.length})
              </p>
              <ul className="mt-4 divide-y divide-[color-mix(in_srgb,var(--mist)_12%,transparent)]">
                {detections.map((d, i) => (
                  <li
                    key={`${d.class}-${i}`}
                    className="flex items-baseline justify-between gap-4 py-2.5 text-sm"
                  >
                    <span className="text-[var(--film)]">{d.class}</span>
                    <span className="tabular-nums text-[var(--mist-dim)]">
                      {formatPct(d.confidence)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--mist-dim)]">
              Diagnosis
            </p>
            <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-[var(--mist)]">
              {result.diagnosis.text}
            </p>
            <p className="mt-2 text-sm text-[var(--mist-dim)]">
              LLM/RAG model: {result.diagnosis.model}
              {result.diagnosis.citations.length
                ? ` · ${result.diagnosis.citations.length} citation(s)`
                : " · no citations yet"}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
