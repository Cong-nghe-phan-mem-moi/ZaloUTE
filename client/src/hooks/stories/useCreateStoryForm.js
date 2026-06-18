import { useEffect, useMemo, useState } from "react";
import { storyAPI } from "../../services/story.service";
import { storyBackgrounds } from "../../utils/storyUtils";

export const useCreateStoryForm = (onCreated) => {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [background, setBackground] = useState(storyBackgrounds[0]);
  const [media, setMedia] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const mediaPreview = useMemo(
    () => (media ? URL.createObjectURL(media) : null),
    [media],
  );

  useEffect(
    () => () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    },
    [mediaPreview],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      await storyAPI.createStory({ text, background, media });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create story.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectTextMode = () => {
    setMode("text");
    setMedia(null);
  };

  const selectMediaMode = () => {
    setMode("media");
  };

  return {
    background,
    error,
    handleSubmit,
    media,
    mediaPreview,
    mode,
    selectMediaMode,
    selectTextMode,
    setBackground,
    setMedia,
    setText,
    submitting,
    text,
  };
};
