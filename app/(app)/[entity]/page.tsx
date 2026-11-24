"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { EntityPage } from "@/components/app/entity-page";
import { entities } from "@/lib/entities";

export default function Page({ params }: { params: Promise<{ entity: string }> }) {
  const { entity } = use(params);
  const def = entities[entity];
  if (!def) notFound();
  return <EntityPage def={def} />;
}
