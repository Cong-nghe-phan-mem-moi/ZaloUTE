import { useEffect, useMemo, useState } from "react";
import { storyAPI } from "../../services/story.service";
import { storyBackgrounds } from "../../utils/storyUtils";
import { DEFAULT_STORY_PRIVACY } from "../../utils/privacy";

export const useCreateStoryForm = (onCreated) => {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [background, setBackground] = useState(storyBackgrounds[0]);
  const [media, setMedia] = useState(null);
  const [privacy, setPrivacy] = useState(DEFAULT_STORY_PRIVACY);
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
      await storyAPI.createStory({ text, background, media, privacy });
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
    privacy,
    selectMediaMode,
    selectTextMode,
    setBackground,
    setMedia,
    setPrivacy,
    setText,
    submitting,
    text,
  };
};
