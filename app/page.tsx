"use client";

import { redirect } from "next/navigation";

export default function Home() {
  // Redirect immediately to the CommitPage
  redirect("/commit");
  return null;
}

