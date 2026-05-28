"use client";

import * as React from "react";

import { RichEditor } from "@/components/editor/rich-editor";
import { updateTopicContent } from "@/features/topics/actions";

interface TopicContentEditorProps {
  topicId: string;
  initialContent: unknown;
}

export function TopicContentEditor({
  topicId,
  initialContent,
}: TopicContentEditorProps) {
  const save = React.useCallback(
    async (content: unknown) => {
      const result = await updateTopicContent(topicId, content);
      return result;
    },
    [topicId]
  );

  return <RichEditor initialContent={initialContent} onSave={save} />;
}
