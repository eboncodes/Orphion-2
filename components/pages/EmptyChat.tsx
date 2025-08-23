import React from 'react';
import { FileText } from 'lucide-react';

const EmptyChat = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-50 p-8">
      <div className="text-center">
        <div className="p-4 bg-gray-200 rounded-full inline-block">
            <FileText className="w-12 h-12 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Pages</h2>
        <p className="max-w-md mx-auto text-base text-gray-600">
          This is your canvas. Create detailed documents, quick drafts, and everything in between.
        </p>
      </div>
    </div>
  );
};

export default EmptyChat;
