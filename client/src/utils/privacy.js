export const PRIVACY_OPTIONS = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can see this.",
    icon: "public",
  },
  {
    value: "friends",
    label: "Friends",
    description: "Only your friends can see this.",
    icon: "group",
  },
  {
    value: "only_me",
    label: "Only me",
    description: "Only you can see this.",
    icon: "lock",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Choose specific people who can see this.",
    icon: "tune",
  },
  {
    value: "hide_some",
    label: "Hide from",
    description: "Everyone except selected people.",
    icon: "visibility_off",
  },
];

export const DEFAULT_POST_PRIVACY = {
  type: "public",
  allowedViewers: [],
  hiddenViewers: [],
};

export const DEFAULT_STORY_PRIVACY = {
  type: "friends",
  allowedViewers: [],
  hiddenViewers: [],
};

export const getPrivacyOption = (type = "public") =>
  PRIVACY_OPTIONS.find((option) => option.value === type) || PRIVACY_OPTIONS[0];

export const normalizePrivacy = (privacy, fallback = DEFAULT_POST_PRIVACY) => ({
  type: privacy?.type || fallback.type,
  allowedViewers: Array.isArray(privacy?.allowedViewers)
    ? privacy.allowedViewers.map((item) => item?._id || item).filter(Boolean)
    : [],
  hiddenViewers: Array.isArray(privacy?.hiddenViewers)
    ? privacy.hiddenViewers.map((item) => item?._id || item).filter(Boolean)
    : [],
});
