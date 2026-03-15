import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/admin/Layout'
import { getVendorEmailHistory } from '@/services/vendor'
import {
  FaEnvelope,
  FaUsers,
  FaCheck,
  FaPaperPlane,
  FaEdit,
  FaEye,
  FaSearch,
  FaChartLine,
  FaInbox,
  FaMousePointer,
  FaCalendarAlt,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEyeSlash,
  FaExpand,
} from 'react-icons/fa'
import toast from 'react-hot-toast'

const VendorEmailHistoryPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<any>(null)
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)
  const [showContentModal, setShowContentModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch email campaigns
  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        page: currentPage,
        limit: 20,
      }

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery
      }

      if (statusFilter) {
        params.status = statusFilter
      }

      const result = await getVendorEmailHistory(params)

      if (result.success && result.data) {
        setCampaigns(result.data.campaigns || [])
        setTotalPages(result.data.pagination?.pages || 1)
        setStats(result.data.stats || null)
      } else {
        throw new Error('Failed to fetch email campaigns')
      }
    } catch (error: any) {
      console.error('Error fetching email campaigns:', error)
      toast.error('Error fetching email campaigns. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearchQuery, statusFilter])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  // Handle status filter
  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
  }

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setStatusFilter('')
    setCurrentPage(1)
  }

  // Toggle campaign expansion
  const toggleCampaignExpansion = (campaignId: string) => {
    setExpandedCampaign(expandedCampaign === campaignId ? null : campaignId)
  }

  // Show content modal
  const showContent = (campaign: any) => {
    setSelectedCampaign(campaign)
    setShowContentModal(true)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  // Format content for display
  const formatContent = (content: string | null | undefined, isHtml: boolean) => {
    if (!content) return 'No content available'

    if (isHtml) {
      return content
    } else {
      return content.replace(/\n/g, '<br>')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-16 w-16 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">
              Email{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500">
                History
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View all sent email campaigns and their performance
            </p>
          </div>
          {/* Navigation buttons */}
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Link
              href="/admin/emails"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              <FaEdit className="mr-2" />
              Send Emails
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400 mr-3">
                  <FaInbox size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Campaigns</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.totalCampaigns?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500 dark:text-green-400 mr-3">
                  <FaUsers size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Recipients</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.totalRecipients?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 dark:text-purple-400 mr-3">
                  <FaEye size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Opens</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {(stats.eventBreakdown?.opened || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 dark:text-orange-400 mr-3">
                  <FaMousePointer size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Clicks</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {(stats.eventBreakdown?.clicked || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-0">Filters</h3>
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              <FaTimes size={12} />
              <span>Clear All</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Campaigns
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by campaign name, subject, or content..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FaSearch size={16} />
                </div>
                {searchQuery && searchQuery !== debouncedSearchQuery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="sent">Sent</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(debouncedSearchQuery || statusFilter) && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Active Filters:</strong>
                {debouncedSearchQuery && ` Search: ${debouncedSearchQuery}`}
                {statusFilter && ` Status: ${statusFilter}`}
              </p>
            </div>
          )}
        </div>

        {/* Campaigns List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
              Email Campaigns ({campaigns.length})
            </h3>

            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FaEnvelope className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Email Campaigns Found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No email campaigns match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">
                            {campaign.name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}
                          >
                            {campaign.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Subject:</strong> {campaign.subject}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <FaCalendarAlt className="mr-1" size={12} />
                            <span className="hidden sm:inline">{formatDate(campaign.sentAt)}</span>
                            <span className="sm:hidden">{new Date(campaign.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </span>
                          <span className="flex items-center">
                            <FaUsers className="mr-1" size={12} />
                            {campaign.recipientCount} recipients
                          </span>
                          <span className="flex items-center">
                            <FaCheck className="mr-1" size={12} />
                            {campaign.deliveryRate}% delivered
                          </span>
                          <span className="flex items-center">
                            <FaEye className="mr-1" size={12} />
                            {campaign.openRate}% opened
                          </span>
                          <span className="flex items-center">
                            <FaMousePointer className="mr-1" size={12} />
                            {campaign.clickRate}% clicked
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                        <button
                          onClick={() => showContent(campaign)}
                          className="flex items-center px-3 py-1.5 text-xs sm:text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                        >
                          <FaEye className="mr-1" size={12} />
                          <span className="hidden sm:inline">View Message</span>
                          <span className="sm:hidden">View</span>
                        </button>
                        <button
                          onClick={() => toggleCampaignExpansion(campaign.id)}
                          className="flex items-center px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                          {expandedCampaign === campaign.id ? (
                            <>
                              <FaEyeSlash className="mr-1" size={12} />
                              <span className="hidden sm:inline">Hide Details</span>
                              <span className="sm:hidden">Hide</span>
                            </>
                          ) : (
                            <>
                              <FaExpand className="mr-1" size={12} />
                              <span className="hidden sm:inline">Show Details</span>
                              <span className="sm:hidden">Details</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {expandedCampaign === campaign.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Content:
                          </h5>
                          <div
                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto"
                            dangerouslySetInnerHTML={{
                              __html: formatContent(campaign.content, campaign.isHtml),
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Event Details */}
                    {campaign.events && campaign.events.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Recent Events:
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {campaign.events.slice(0, 6).map((event: any, index: number) => (
                            <div key={index} className="text-xs bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                              <span className="font-medium">{event.eventType}</span>
                              {event.email && (
                                <span className="text-gray-500 dark:text-gray-400 ml-1">- {event.email}</span>
                              )}
                              {event.reason && (
                                <span className="text-emerald-500 ml-1">({event.reason})</span>
                              )}
                            </div>
                          ))}
                          {campaign.events.length > 6 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{campaign.events.length - 6} more events
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Modal */}
        {showContentModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                      Email Content: {selectedCampaign.subject}
                    </h3>
                    <div className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Sent on {formatDate(selectedCampaign.sentAt)} to {selectedCampaign.recipientCount}{' '}
                      recipients
                    </div>
                  </div>
                  <button
                    onClick={() => setShowContentModal(false)}
                    className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FaTimes size={18} />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Content Type: {selectedCampaign.isHtml ? 'HTML' : 'Plain Text'}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {selectedCampaign.isHtml ? 'HTML' : 'Text'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-600 overflow-x-auto">
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: formatContent(selectedCampaign.content, selectedCampaign.isHtml),
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => setShowContentModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCampaign.content || '')
                      toast.success('Content copied to clipboard')
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Copy Content
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default VendorEmailHistoryPage
