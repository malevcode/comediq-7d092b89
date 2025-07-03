import PerformanceTracker from '@/components/PerformanceTracker';

const TrackSets = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <PerformanceTracker />
      </div>
    </div>
  );
};

export default TrackSets;
