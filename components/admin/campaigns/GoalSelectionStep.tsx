// Goal Selection Step Component
// First step in campaign creation - select campaign goal

import React from 'react'
import { FaBullseye, FaGlobe, FaPhone, FaShoppingCart, FaInfoCircle, FaFlag } from 'react-icons/fa'

interface Goal {
  id: string
  title: string
  description: string
  objective: 'BRAND_AWARENESS' | 'TRAFFIC' | 'LEADS' | 'SALES' | 'POLITICAL'
  icon: React.ReactNode
  recommended?: boolean
}

interface GoalSelectionStepProps {
  onSelectGoal: (objective: 'BRAND_AWARENESS' | 'TRAFFIC' | 'LEADS' | 'SALES' | 'POLITICAL') => void
}

const GoalSelectionStep: React.FC<GoalSelectionStepProps> = ({ onSelectGoal }) => {
  const goals: Goal[] = [
    {
      id: 'brand-awareness',
      title: 'Brand Awareness',
      description: 'Increase awareness of your brand and reach more people',
      objective: 'BRAND_AWARENESS',
      icon: <FaBullseye className="h-6 w-6" />,
      recommended: true,
    },
    {
      id: 'traffic',
      title: 'Get More Website Visitors',
      description: 'Drive traffic to your website and increase visits',
      objective: 'TRAFFIC',
      icon: <FaGlobe className="h-6 w-6" />,
      recommended: true,
    },
    {
      id: 'leads',
      title: 'Get More Leads',
      description: 'Get more leads through calls, WhatsApp messages, and form submissions',
      objective: 'LEADS',
      icon: <FaPhone className="h-6 w-6" />,
      recommended: true,
    },
    {
      id: 'sales',
      title: 'Drive Sales',
      description: 'Increase sales and conversions for your products or services',
      objective: 'SALES',
      icon: <FaShoppingCart className="h-6 w-6" />,
    },
    {
      id: 'political',
      title: 'Political Campaign',
      description: 'Raise political awareness and engage with your audience on important issues',
      objective: 'POLITICAL',
      icon: <FaFlag className="h-6 w-6" />,
    },
  ]

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Create Campaign
        </h1>
        <h2 className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mb-4">
          Choose a goal
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Select what you want to achieve with this campaign
        </p>
      </div>

      <div className="bus-responsive-two-col gap-4 sm:gap-6">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => onSelectGoal(goal.objective)}
            className="group relative bg-white dark:bg-slate-900/70 rounded-xl p-6 border-2 border-slate-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-400/60 transition-all duration-200 shadow-sm hover:shadow-md text-left"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
                {goal.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {goal.title}
                  </h3>
                  {goal.recommended && (
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {goal.description}
                </p>
              </div>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <p className="font-medium mb-1">Not sure which goal to choose?</p>
            <p>
              <strong>Brand Awareness</strong> is best for reaching new audiences.{' '}
              <strong>Traffic</strong> helps drive visitors to your website.{' '}
              <strong>Leads</strong> focuses on getting contact information.{' '}
              <strong>Sales</strong> is ideal for promoting products and driving purchases.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoalSelectionStep
