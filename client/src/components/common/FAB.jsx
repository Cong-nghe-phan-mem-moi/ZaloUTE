const FAB = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 bg-primary-container text-on-primary-container p-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all z-40 flex items-center gap-2"
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-label-md text-label-md">{label}</span>
    </button>
  );
};

export default FAB;
