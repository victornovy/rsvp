"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { cn } from "@/lib/cn";

type ScanState =
  | { kind: "scanning" }
  | { kind: "checking" }
  | { kind: "valid"; guestName: string }
  | { kind: "already_used"; guestName: string; checkedInAt: string }
  | { kind: "invalid" }
  | { kind: "link_invalid" }
  | { kind: "camera_error"; message: string };

const READER_ID = "qr-reader";

function playFeedback(success: boolean) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(success ? 120 : [80, 60, 80]);
  }
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = success ? 880 : 220;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ambiente sem suporte a Web Audio — segue sem som.
  }
}

export function ValidatorScanner({ linkToken }: { linkToken: string }) {
  const [state, setState] = useState<ScanState>({ kind: "scanning" });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;
    let cancelled = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          void handleScan(decodedText);
        },
        () => {
          // Disparado a cada frame sem QR legível — comportamento normal, ignora.
        },
      )
      .catch((err) => {
        if (!cancelled) {
          setState({
            kind: "camera_error",
            message: err instanceof Error ? err.message : "Não foi possível acessar a câmera.",
          });
        }
      });

    return () => {
      cancelled = true;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkToken]);

  async function handleScan(qrToken: string) {
    if (processingRef.current) return;
    processingRef.current = true;
    scannerRef.current?.pause(true);
    setState({ kind: "checking" });

    try {
      const res = await fetch(`/api/validate/${linkToken}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: qrToken }),
      });
      const json = await res.json();

      if (!res.ok) {
        setState({ kind: "invalid" });
        playFeedback(false);
        return;
      }

      if (json.result === "valid") {
        setState({ kind: "valid", guestName: json.guest_name });
        playFeedback(true);
      } else if (json.result === "already_used") {
        setState({
          kind: "already_used",
          guestName: json.guest_name,
          checkedInAt: json.checked_in_at,
        });
        playFeedback(false);
      } else if (json.result === "link_invalid") {
        setState({ kind: "link_invalid" });
        playFeedback(false);
      } else {
        setState({ kind: "invalid" });
        playFeedback(false);
      }
    } catch {
      setState({ kind: "invalid" });
      playFeedback(false);
    }
  }

  function next() {
    processingRef.current = false;
    setState({ kind: "scanning" });
    scannerRef.current?.resume();
  }

  const resultKind =
    state.kind === "valid" ||
    state.kind === "already_used" ||
    state.kind === "invalid" ||
    state.kind === "link_invalid"
      ? state.kind
      : null;

  return (
    <>
      <div className="relative overflow-hidden rounded-card border border-white/10 bg-black">
        <div id={READER_ID} className="[&_video]:w-full" />
        {state.kind === "checking" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="font-mono text-xs uppercase tracking-widest text-white">Verificando…</p>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-white/50">
        Aponte a câmera para o QR do convidado.
      </p>

      {state.kind === "camera_error" && (
        <div className="mt-6 rounded-2xl border border-clay/40 bg-clay-light px-4 py-3 text-center text-sm text-clay">
          <p>{state.message} Verifique a permissão de câmera do navegador.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-full bg-clay px-5 py-2 text-sm font-semibold text-white"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {resultKind && (
        <div
          className={cn(
            "animate-fade-up fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-6 text-center",
            resultKind === "valid" && "bg-mint",
            resultKind === "already_used" && "bg-amber",
            (resultKind === "invalid" || resultKind === "link_invalid") && "bg-clay",
          )}
        >
          {state.kind === "valid" && (
            <>
              <p className="font-display text-4xl text-white">✓ Entrada liberada</p>
              <p className="text-lg text-white/90">{state.guestName}</p>
            </>
          )}
          {state.kind === "already_used" && (
            <>
              <p className="font-display text-3xl text-white">QR já utilizado</p>
              <p className="text-lg text-white/90">{state.guestName}</p>
              <p className="text-sm text-white/70">
                às{" "}
                {new Date(state.checkedInAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </>
          )}
          {state.kind === "invalid" && (
            <p className="font-display text-3xl text-white">Credencial inválida</p>
          )}
          {state.kind === "link_invalid" && (
            <>
              <p className="font-display text-3xl text-white">Link expirado ou revogado</p>
              <p className="text-sm text-white/80">Peça um novo link de validação ao organizador.</p>
            </>
          )}

          {resultKind !== "link_invalid" && (
            <button
              type="button"
              onClick={next}
              className="mt-6 min-w-[220px] rounded-full bg-white px-8 py-4 text-base font-bold text-ink shadow-lg active:scale-95"
            >
              Próximo
            </button>
          )}
        </div>
      )}
    </>
  );
}
