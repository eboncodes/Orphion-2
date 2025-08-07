import React from 'react';
import { Search, Globe, Zap } from 'lucide-react';

export default function WebSearchHelp() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Search className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            🔍 Web Search Available
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            I can search the web for real-time information! Try asking me about:
          </p>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>"What's the latest news about AI?"</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>"search: how to learn React in 2024"</span>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>"Find information about climate change"</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 