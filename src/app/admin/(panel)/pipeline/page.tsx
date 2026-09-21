import type { Metadata } from "next";
import { content } from "@/content";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";

export const metadata: Metadata = { title: content.admin.pipeline.title };

export default function PipelinePage() {
  return <PipelineBoard />;
}
