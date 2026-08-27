import { useParams, Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import Card from "../components/Topic/Card.jsx";
import AddTopicModal from "../components/Topic/AddTopicModal.jsx";
import { useDashboard } from "../context/DashboardContext.jsx";

export default function Topic() {
  const { trackId } = useParams();
  const [showModal, setShowModal] = useState(false);
  const {
    topics,
    topicsLoading,
    topicsError,
    fetchTopics,
    createNewTopic,
    tracks,
  } = useDashboard();

  useEffect(() => {
    if (trackId) {
      fetchTopics(trackId);
    }
  }, [trackId, fetchTopics]);

  const currentTrack = tracks.find((t) => (t._id || t.id) === trackId);
  const trackName = currentTrack?.name || "Track";

  const handleAddTopic = async (topicName) => {
    await createNewTopic(trackId, topicName);
  };

  return (
    <div className="p-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500 hover:text-gray-700">
          <Link to="/dashboard">Dashboard</Link>
        </span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-900">{trackName}</span>
      </div>

      {/* Heading & Add Topic Action */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{trackName}</h1>
          <p className="text-gray-500">
            {topics.length} topic{topics.length === 1 ? "" : "s"} tracked in
            this learning path.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-sm"
        >
          <Plus size={18} />
          Add Topic
        </button>
      </div>

      {/* Loading State */}
      {topicsLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      )}

      {/* Error State */}
      {topicsError && !topicsLoading && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 mb-6">
          {topicsError}
        </div>
      )}

      {/* Cards */}
      {!topicsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 border border-dashed rounded-xl">
              No topics found for this track yet.
            </div>
          ) : (
            topics.map((topic) => {
              const topicId = topic._id || topic.id;
              return (
                <Card
                  key={topicId}
                  id={topicId}
                  trackId={trackId}
                  name={topic.name || topic.topic}
                  activities={
                    topic.activitiesCount ||
                    topic.activityCount ||
                    topic.activities?.length ||
                    0
                  }
                  lastActive={
                    topic.lastActive || topic.updatedAt
                      ? new Date(
                          topic.updatedAt || Date.now(),
                        ).toLocaleDateString()
                      : "Recently"
                  }
                />
              );
            })
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddTopicModal
          trackName={trackName}
          onClose={() => setShowModal(false)}
          onSubmit={handleAddTopic}
        />
      )}
    </div>
  );
}
