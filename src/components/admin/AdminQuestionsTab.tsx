"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/format";

export default function AdminQuestionsTab() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Answering modal/inline state
  const [answeringQuestion, setAnsweringQuestion] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [answeredBy, setAnsweredBy] = useState("Tim Admin & Mitra DUDI");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/questions?filter=${filter}`);
      const json = await res.json();
      if (json.success) {
        setQuestions(json.questions || []);
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [filter]);

  const handleOpenAnswerModal = (q: any) => {
    setAnsweringQuestion(q);
    setAnswerText(q.answer_text || "");
    setAnsweredBy(q.answered_by || `Admin — ${q.company_name}`);
    setErrorMsg("");
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim()) {
      setErrorMsg("Jawaban tidak boleh kosong.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const res = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: answeringQuestion.id,
          answer_text: answerText.trim(),
          answered_by: answeredBy.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan jawaban");

      setQuestions((prev) =>
        prev.map((q) => (q.id === answeringQuestion.id ? json.question : q))
      );
      setAnsweringQuestion(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Hapus pertanyaan ini secara permanen dari forum?")) return;

    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  };

  const unansweredCount = questions.filter((q) => !q.is_answered).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            💬 Moderasi Tanya Jawab (Q&A) Siswa
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Tinjau pertanyaan calon peserta magang, berikan respon resmi, atau bersihkan pertanyaan yang tidak pantas
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--accent-tint)] rounded-lg text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "all"
                ? "bg-[var(--bg-card)] font-medium text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter("unanswered")}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
              filter === "unanswered"
                ? "bg-[var(--bg-card)] font-medium text-amber-500 shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>Menunggu Jawaban</span>
            {unansweredCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setFilter("answered")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "answered"
                ? "bg-[var(--bg-card)] font-medium text-emerald-500 shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Sudah Terjawab
          </button>
        </div>
      </div>

      {/* Question List */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-28 rounded-xl skeleton" />
          <div className="h-28 rounded-xl skeleton" />
          <div className="h-28 rounded-xl skeleton" />
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card p-12 text-center text-xs text-[var(--text-muted)]">
          Tidak ada pertanyaan dalam kategori ini.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="glass-card p-5 space-y-3">
              {/* Top info */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-[var(--text-primary)]">
                      {q.company_name}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      ({q.company_city})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-tint)] text-[var(--text-secondary)] font-mono">
                      👤 {q.author_name || "Siswa Anonim"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] font-medium pt-1">
                    "{q.question_text}"
                  </p>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                    q.is_answered
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}
                >
                  {q.is_answered ? "Terjawab" : "Menunggu"}
                </span>
              </div>

              {/* Answer Box if answered */}
              {q.is_answered && (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Respon Resmi oleh {q.answered_by || "Admin"}:</span>
                    {q.answered_at && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {formatRelativeTime(q.answered_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-secondary)]">{q.answer_text}</p>
                </div>
              )}

              {/* Actions & Timestamp */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)] text-xs">
                <span className="text-[11px] text-[var(--text-muted)]">
                  Ditanyakan {formatRelativeTime(q.created_at)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="px-2.5 py-1 rounded text-[11px] text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                  >
                    🗑️ Hapus
                  </button>
                  <button
                    onClick={() => handleOpenAnswerModal(q)}
                    className="px-3 py-1 rounded text-[11px] font-semibold bg-[var(--accent-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-colors shadow-xs"
                  >
                    {q.is_answered ? "✏️ Edit Jawaban" : "✍️ Berikan Jawaban"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANSWER MODAL */}
      {answeringQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="glass-card max-w-lg w-full p-6 space-y-4 shadow-xl border border-[var(--border-hover)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-primary)]">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                ✍️ {answeringQuestion.is_answered ? "Perbarui Jawaban" : "Respon Pertanyaan Siswa"}
              </h4>
              <button
                onClick={() => setAnsweringQuestion(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Question preview */}
            <div className="p-3 rounded-lg bg-[var(--accent-tint)] text-xs space-y-1">
              <span className="font-semibold text-[var(--text-primary)]">
                Pertanyaan untuk {answeringQuestion.company_name}:
              </span>
              <p className="text-[var(--text-secondary)] italic">
                "{answeringQuestion.question_text}"
              </p>
            </div>

            <form onSubmit={handleSubmitAnswer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Nama Pemberi Jawaban / Jabatan
                </label>
                <input
                  type="text"
                  required
                  value={answeredBy}
                  onChange={(e) => setAnsweredBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Isi Jawaban Resmi *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan informasi resmi, misalnya: Jam kerja magang dari 08:00 - 16:00 WIB, mendapatkan sertifikat dan uang saku bulanan..."
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-primary)]">
                <button
                  type="button"
                  onClick={() => setAnsweringQuestion(null)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--accent-tint)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Publikasikan Jawaban"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
