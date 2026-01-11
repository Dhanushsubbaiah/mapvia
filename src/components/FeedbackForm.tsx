"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      if (!response.ok) {
        throw new Error("Request failed");
      }
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Name
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
          required
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Email
        </label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          type="email"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
          required
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Feedback
        </label>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell us what to improve or add."
          rows={4}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
          required
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending..." : "Send feedback"}
      </button>
      {status === "sent" && (
        <p className="text-sm font-medium text-emerald-700">
          Thanks! Your feedback is in.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm font-medium text-rose-600">
          Please complete all fields and try again.
        </p>
      )}
    </form>
  );
}
