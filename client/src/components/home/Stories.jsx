import { useNavigate } from "react-router-dom";
import { useStories } from "../../hooks";
import CreateStoryModal from "./stories/CreateStoryModal";
import { AddStoryCard, OwnStoryCard, StoryGroupCard } from "./stories/StoryCards";
import StoryViewer from "./stories/StoryViewer";

const Stories = ({ profile, initialStoryId = null }) => {
  const navigate = useNavigate();
  const {
    currentUserId,
    createOpen,
    error,
    finishStories,
    groupedStories,
    loading,
    loadStories,
    openGroup,
    ownStories,
    setCreateOpen,
    setViewerState,
    updateStoryInList,
    viewerState,
  } = useStories({ profile, initialStoryId, navigate });

  return (
    <section className="rounded bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#111827]">Stories</h2>
          <p className="text-xs text-[#6b7280]">
            Share moments that disappear after 24 hours.
          </p>
        </div>
        {loading ? (
          <span className="text-xs font-medium text-[#6b7280]">Loading...</span>
        ) : null}
      </div>

      {error ? (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-1">
        <AddStoryCard profile={profile} onCreate={() => setCreateOpen(true)} />

        {ownStories ? (
          <OwnStoryCard
            profile={profile}
            group={ownStories}
            onOpen={() => {
              const ownIndex = groupedStories.findIndex(
                (group) => String(group.authorId) === String(currentUserId),
              );
              if (ownIndex >= 0) openGroup(ownIndex);
            }}
          />
        ) : null}

        {groupedStories
          .filter((group) => String(group.authorId) !== String(currentUserId))
          .map((group) => (
            <StoryGroupCard
              key={group.authorId}
              group={group}
              onOpen={() => openGroup(groupedStories.indexOf(group))}
            />
          ))}
      </div>

      {!loading && groupedStories.length === 0 ? (
        <p className="mt-3 text-sm text-[#6b7280]">
          No active stories from you or your friends yet.
        </p>
      ) : null}

      {createOpen ? (
        <CreateStoryModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            loadStories();
          }}
        />
      ) : null}

      {viewerState ? (
        <StoryViewer
          groups={groupedStories}
          viewerState={viewerState}
          currentUserId={currentUserId}
          onChange={setViewerState}
          onClose={() => setViewerState(null)}
          onDeleted={() => {
            setViewerState(null);
            loadStories();
          }}
          onFinished={finishStories}
          onStoryUpdated={updateStoryInList}
        />
      ) : null}
    </section>
  );
};

export default Stories;
