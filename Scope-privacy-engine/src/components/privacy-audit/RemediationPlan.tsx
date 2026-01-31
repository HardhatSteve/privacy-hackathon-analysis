'use client';

import { ExternalLink, ArrowRight } from 'lucide-react';
import type { Recommendation } from './types';

/**
 * RemediationPlan - Premium recommendation cards
 * ElevenLabs-style with clean layout and subtle interactions
 */

interface RemediationPlanProps {
  actions: Recommendation[];
}

interface ToolGroup {
  tool?: string;
  url?: string;
  actions: Recommendation[];
}

export function RemediationPlan({ actions }: RemediationPlanProps) {
  if (actions.length === 0) {
    return null;
  }

  // Group by tool
  const toolGroups = actions.reduce<Record<string, ToolGroup>>((acc, action) => {
    const key = action.tool ?? 'General';
    if (!acc[key]) {
      acc[key] = { tool: action.tool, url: action.toolUrl, actions: [] };
    }
    acc[key].actions.push(action);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recommendations</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tools and actions to improve your privacy score
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(toolGroups).map(([key, group]) => (
          <div
            key={key}
            className="p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
          >
            {/* Tool Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {group.tool ?? 'General Tips'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {group.actions.length} action{group.actions.length > 1 ? 's' : ''}
                </p>
              </div>
              {group.url && (
                <a
                  href={group.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 
                             bg-black text-white text-xs font-medium
                             rounded-lg
                             hover:bg-gray-800
                             transition-colors"
                >
                  Open
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Actions */}
            <ul className="space-y-2.5">
              {group.actions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    {action.action}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
