import { Plus, Code2, Globe, Cpu, Database, Server, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import Card from "../components/Card/Card";
import AddTrackModal from "../components/dashboard/AddTrackModal";
import ExtensionPrompt from "../components/Extension/ExtensionPrompt.jsx";
import { useDashboard } from "../context/DashboardContext.jsx";

function getTrackIcon(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("dsa") || lower.includes("algorithm")) return Code2;
  if (lower.includes("web") || lower.includes("frontend")) return Globe;
  if (lower.includes("machine") || lower.includes("ai")) return Cpu;
  if (lower.includes("data") || lower.includes("sql")) return Database;
  if (lower.includes("system") || lower.includes("os")) return Server;
  return BookOpen;
}

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const { tracks, tracksLoading, tracksError, fetchTracks, createNewTrack } = useDashboard();

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const handleAddTrack = async (trackName) => {
    await createNewTrack(trackName);
  };

  return (
    <div className="p-10">
      {/* Header */}
      <nav className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-500">
            Track and organize your learning topics.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-sm"
        >
          <Plus size={18} />
          Add Track
        </button>
      </nav>

      {/* Chrome Extension Onboarding Prompt */}
      <ExtensionPrompt />

      {/* Loading state */}
      {tracksLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        </div>
      )}

      {/* Error state */}
      {tracksError && !tracksLoading && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 mb-6">
          {tracksError}
        </div>
      )}

      {/* Tracks Grid */}
      {!tracksLoading && (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {tracks.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 border border-dashed rounded-xl">
              No learning tracks found. Click "Add Track" to create your first track!
            </div>
          ) : (
            tracks.map((track) => {
              const trackId = track._id || track.id;
              const IconComponent = getTrackIcon(track.name);
              return (
                <Card
                  key={trackId}
                  id={trackId}
                  name={track.name}
                  icon={IconComponent}
                  topics={track.topicsCount || track.topicCount || track.topics?.length || 0}
                  lastActive={track.lastActive || (track.updatedAt ? new Date(track.updatedAt).toLocaleDateString() : "Recently")}
                  progress={track.progress || 0}
                />
              );
            })
          )}
        </section>
      )}

      {/* Modal */}
      {showModal && (
        <AddTrackModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddTrack}
        />
      )}
    </div>
  );
}