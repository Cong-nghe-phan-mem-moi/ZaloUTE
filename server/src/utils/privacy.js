const mongoose = require('mongoose');

const PRIVACY_TYPES = ['public', 'friends', 'only_me', 'custom', 'hide_some'];

const getId = (value) => String(value?._id || value || '');

const toObjectIds = (values = []) =>
  [...new Set((Array.isArray(values) ? values : [values]).map(getId).filter(Boolean))]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const normalizePrivacy = (input = {}) => {
  const source = typeof input === 'string' ? { type: input } : input || {};
  const type = PRIVACY_TYPES.includes(source.type) ? source.type : 'public';

  return {
    type,
    allowedViewers: toObjectIds(parseList(source.allowedViewers)),
    hiddenViewers: toObjectIds(parseList(source.hiddenViewers)),
  };
};

const normalizePrivacyFromPayload = (payload = {}) => {
  if (payload.privacy) {
    try {
      return normalizePrivacy(
        typeof payload.privacy === 'string'
          ? JSON.parse(payload.privacy)
          : payload.privacy,
      );
    } catch {
      return normalizePrivacy({ type: payload.privacy });
    }
  }

  return normalizePrivacy({
    type: payload.privacyType,
    allowedViewers: payload.allowedViewers,
    hiddenViewers: payload.hiddenViewers,
  });
};

const getFriendIdSet = (user) =>
  new Set((user?.friends || []).map((friend) => getId(friend)).filter(Boolean));

const canViewByPrivacy = (item, viewerId, viewerFriendIds = []) => {
  const authorId = getId(item?.author);
  const currentViewerId = getId(viewerId);

  if (!authorId || !currentViewerId) {
    return false;
  }

  if (authorId === currentViewerId) {
    return true;
  }

  const privacy = item?.privacy || { type: 'public' };
  const type = privacy.type || 'public';
  const allowed = new Set((privacy.allowedViewers || []).map(getId));
  const hidden = new Set((privacy.hiddenViewers || []).map(getId));
  const friendIds = new Set(viewerFriendIds.map(getId));

  if (hidden.has(currentViewerId)) {
    return false;
  }

  if (type === 'public') {
    return true;
  }

  if (type === 'friends') {
    return friendIds.has(authorId);
  }

  if (type === 'custom') {
    return allowed.has(currentViewerId);
  }

  if (type === 'hide_some') {
    return true;
  }

  return false;
};

const canViewPostWithSharedSource = (post, viewerId, viewerFriendIds = []) => {
  if (!canViewByPrivacy(post, viewerId, viewerFriendIds)) {
    return false;
  }

  if (!post?.sharedFrom) {
    return true;
  }

  if (typeof post.sharedFrom === 'string' || post.sharedFrom instanceof mongoose.Types.ObjectId) {
    return true;
  }

  return canViewByPrivacy(post.sharedFrom, viewerId, viewerFriendIds);
};

const buildPrivacyMongoFilter = (viewerId, viewerFriendIds = []) => {
  const currentViewerId = getId(viewerId);
  const friendIds = viewerFriendIds.map(getId).filter(Boolean);

  if (!currentViewerId) {
    return {
      'privacy.type': 'public',
    };
  }

  return {
    $or: [
      { author: currentViewerId },
      { 'privacy.type': 'public' },
      {
        $and: [
          { 'privacy.type': 'friends' },
          { author: { $in: friendIds } },
          { 'privacy.hiddenViewers': { $ne: currentViewerId } },
        ],
      },
      {
        $and: [
          { 'privacy.type': 'custom' },
          { 'privacy.allowedViewers': currentViewerId },
          { 'privacy.hiddenViewers': { $ne: currentViewerId } },
        ],
      },
      {
        $and: [
          { 'privacy.type': 'hide_some' },
          { 'privacy.hiddenViewers': { $ne: currentViewerId } },
        ],
      },
      { privacy: { $exists: false } },
    ],
  };
};

module.exports = {
  PRIVACY_TYPES,
  buildPrivacyMongoFilter,
  canViewByPrivacy,
  canViewPostWithSharedSource,
  getFriendIdSet,
  normalizePrivacy,
  normalizePrivacyFromPayload,
};
