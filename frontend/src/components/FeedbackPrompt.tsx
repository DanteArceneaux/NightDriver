import { useState } from 'react';

interface FeedbackPromptProps {
  zoneId: string;
  zoneName: string;
  predictedScore: number;
  onSubmit: (feedback: 'slow' | 'ok' | 'busy') => void;
  onDismiss: () => void;
}

export function FeedbackPrompt({
  zoneId,
  zoneName,
  predictedScore,
  onSubmit,
  onDismiss,
}: FeedbackPromptProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (feedback: 'slow' | 'ok' | 'busy') => {
    setSubmitted(true);
    onSubmit(feedback);
    setTimeout(onDismiss, 2000);
  };

  if (submitted) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl">
        <p className="font-semibold">✅ Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border-2 border-blue-500 text-white px-6 py-4 rounded-lg shadow-xl max-w-sm">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        ×
      </button>
      <h3 className="font-bold text-lg mb-2">How busy was {zoneName}?</h3>
      <p className="text-sm text-gray-400 mb-4">
        We predicted: {predictedScore} • Help us improve!
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => handleFeedback('slow')}
          className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-center transition-colors"
        >
          <div className="text-2xl mb-1">😴</div>
          <div className="text-xs">Slow</div>
        </button>
        <button
          onClick={() => handleFeedback('ok')}
          className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-center transition-colors"
        >
          <div className="text-2xl mb-1">😐</div>
          <div className="text-xs">OK</div>
        </button>
        <button
          onClick={() => handleFeedback('busy')}
          className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-center transition-colors"
        >
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-xs">Busy</div>
        </button>
      </div>
    </div>
  );
}

