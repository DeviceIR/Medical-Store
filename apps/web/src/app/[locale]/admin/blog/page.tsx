"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/utils";
import { MotionButton } from "@/components/Button";

export default function AdminBlog() {
  const [form, setForm] = useState({
    slug: "",
    titleFa: "",
    titleEn: "",
    excerptFa: "",
    excerptEn: "",
    bodyFa: "",
    bodyEn: "",
  });
  const [ok, setOk] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    await api("/admin/blog", { method: "POST", body: JSON.stringify(form) });
    setOk(true);
  }
  return (
    <form className="container-page max-w-2xl space-y-3 py-10" onSubmit={submit}>
      <h1 className="text-3xl font-extrabold">Guide</h1>
      {Object.entries(form).map(([k, v]) => (
        <textarea
          key={k}
          className="input min-h-16"
          placeholder={k}
          value={v}
          onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        />
      ))}
      <MotionButton className="btn btn-primary">Publish</MotionButton>
      {ok ? <p>Saved</p> : null}
    </form>
  );
}
