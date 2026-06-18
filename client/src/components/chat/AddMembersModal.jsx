import { useMemo, useState } from "react";
import { UserAvatar } from "../common";

const AddMembersModal = ({ onClose, friends, conversation, onAddMembers }) => {
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const existingParticipantIds = useMemo(
    () => (conversation?.participants || []).map((person) => (person._id || person).toString()),
    [conversation],
  );

  const addableFriends = useMemo(
    () =>
      friends.filter((friend) => {
        const friendId = (friend.id || friend._id || "").toString();
        return !existingParticipantIds.includes(friendId);
      }),
    [existingParticipantIds, friends],
  );

  const handleToggleFriend = (friendId) => {
    setSelectedFriends((current) =>
      current.includes(friendId)
        ? current.filter((id) => id !== friendId)
        : [...current, friendId],
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (selectedFriends.length === 0) {
      setErrorMsg("Please select at least 1 friend to add");
      return;
    }

    onAddMembers(selectedFriends);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <span className="material-symbols-outlined text-blue-600">
              person_add
            </span>
            Add Members to Group
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex max-h-[80vh] flex-col p-6">
          {errorMsg ? (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-600">
              {errorMsg}
            </div>
          ) : null}

          <div className="mb-6 max-h-[260px] flex-1 overflow-y-auto pr-1">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Select Friends ({selectedFriends.length} selected)
            </label>
            {addableFriends.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                All of your friends are already in this group.
              </p>
            ) : (
              <div className="space-y-1">
                {addableFriends.map((friend) => {
                  const friendId = friend.id || friend._id;
                  const isChecked = selectedFriends.includes(friendId);

                  return (
                    <FriendPickerItem
                      key={friendId}
                      friend={friend}
                      checked={isChecked}
                      onClick={() => handleToggleFriend(friendId)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-auto flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addableFriends.length === 0}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:bg-blue-700 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              Add to group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FriendPickerItem = ({ friend, checked, onClick }) => (
  <div
    onClick={onClick}
    className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition ${
      checked ? "border-blue-100 bg-blue-50/50" : "border-transparent hover:bg-gray-50"
    }`}
  >
    <div className="flex items-center gap-3">
      <UserAvatar image={friend.avatar} name={friend.fullName} size="sm" />
      <span className="text-sm font-semibold text-gray-800">
        {friend.fullName}
      </span>
    </div>
    <div
      className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
        checked ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white"
      }`}
    >
      {checked ? (
        <span className="material-symbols-outlined text-[14px] font-bold">
          check
        </span>
      ) : null}
    </div>
  </div>
);

export default AddMembersModal;

