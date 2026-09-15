"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/format";
import { CompanyQuestion } from "@/lib/types";

export default function CompanyQNA({ companyId }: { companyId: string }) {
  const [questions, setQuestions] = useState<CompanyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/companies/${companyId}/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || newQuestionText.trim().length < 10) {
      setErrorMsg("Pertanyaan minimal 10 karakter.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`/api/companies/${companyId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_text: newQuestionText.trim() }),
      });

      if (res.ok) {
        setNewQuestionText("");
        setSuccessMsg("Pertanyaan anonim berhasil dikirim! Menunggu tanggapan perusahaan.");
        fetchQuestions();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Gagal mengirim pertanyaan.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Ajukan Pertanyaan */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-xs">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-1">
          <span className="p-1 rounded-lg bg-blue-500/10 text-blue-400">❓</span>
          Tanya Anonim ke Perusahaan ini
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Ingin tahu info seperti alur seleksi, fasilitas, atau jam kerja? Identitas siswa dijamin anonim dengan enkripsi hash.
        </p>

        <form onSubmit={handleSubmitQuestion} className="space-y-3">
          <textarea
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder="Contoh: Apakah untuk siswa jurusan RPL disediakan laptop kantor dari perusahaan?"
            rows={3}
            className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-colors resize-none"
          />

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              {successMsg}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newQuestionText.trim()}
              className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold text-xs hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Pertanyaan Anonim →"}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar Pertanyaan */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Tanya Jawab Siswa & Perusahaan ({questions.length})
        </h4>

        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)]">
            Memuat forum Q&A...
          </div>
        ) : questions.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] text-xs text-[var(--text-muted)]">
            Belum ada pertanyaan diajukan. Jadi yang pertama bertanya!
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] space-y-3 transition-colors hover:border-[var(--border-hover)]"
            >
              {/* Question text */}
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                  Q
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed">
                    {q.question_text}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    Diajukan anonim • {formatRelativeTime(q.created_at)}
                  </span>
                </div>
              </div>

              {/* Answer text */}
              {q.is_answered && q.answer_text ? (
                <div className="ml-8 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="px-1.5 py-0.2 rounded font-semibold text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ Tanggapan Resmi
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] truncate">
                      {q.answered_by || "Pihak Perusahaan"}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-auto font-mono">
                      {q.answered_at ? formatRelativeTime(q.answered_at) : ""}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {q.answer_text}
                  </p>
                </div>
              ) : (
                <div className="ml-8 p-2.5 rounded-lg bg-[var(--accent-tint)] border border-dashed border-[var(--border-primary)] flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span>⏳ Menunggu jawaban resmi dari pihak perusahaan...</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
