// Business Suite – Work Validation
// Route: /admin/work-validation
// Review and approve completed work from partners

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/Layout'
import { getCampaigns, getApplications, approveWork, bulkApproveWork } from '@/services/vendor'
import {
  FaSpinner,
  FaArrowLeft,
  FaCheckCircle,
  FaEye,
  FaUser,
  FaBriefcase,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaClock,
  FaTh,
  FaList,
} from 'react-icons/fa'

const WorkValidationPage: React.FC = () => {
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [isBulkApproving, setIsBulkApproving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCampaign, setFilterCampaign] = useState('all')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false)
  const [workStatusFilter, setWorkStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  useEffect(() => {
    fetchApplications(1, limit)
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const result = await getCampaigns({ limit: 100 })
      setCampaigns(result.data || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const fetchApplications = async (pageOverride?: number, limitOverride?: number) => {
    try {
      setIsLoading(true)
      const currentPage = pageOverride ?? page
      const currentLimit = limitOverride ?? limit
      const params: any = {
        status: 'APPROVED',
        workCompleted: true,
        page: currentPage,
        limit: currentLimit,
      }
      if (filterCampaign !== 'all') params.campaignId = filterCampaign
      if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim()

      // Apply work status filter via backend flags
      if (workStatusFilter === 'pending') {
        params.workApproved = false
      } else if (workStatusFilter === 'approved') {
        params.workApproved = true
      }

      const result = await getApplications(params)
      const apps = result.data || []

      setApplications(apps)
      if (result.pagination) {
        setPagination(result.pagination)
        setPage(result.pagination.page)
        setLimit(result.pagination.limit)
      } else {
        setPagination(null)
        setPage(currentPage)
        setLimit(currentLimit)
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        router.push('/admin/auth')
        return
      }
      toast.error(error.response?.data?.error || 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Reset to first page when filters change
    fetchApplications(1, limit)
  }, [filterCampaign, workStatusFilter, limit])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim() || !searchTerm) {
        fetchApplications(1, limit)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSelectApplication = (applicationId: string) => {
    setSelectedApplications((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId)
      } else {
        newSet.add(applicationId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    // Only select applications that are pending approval
    const pendingApps = applications.filter((app: any) => !app.workApprovedByVendor)
    const pendingIds = new Set(pendingApps.map((app) => app.id))
    
    if (selectedApplications.size === pendingIds.size && pendingIds.size > 0) {
      setSelectedApplications(new Set())
    } else {
      setSelectedApplications(pendingIds)
    }
  }

  const handleBulkApproveWork = () => {
    if (selectedApplications.size === 0) {
      toast.error('Please select at least one application to approve')
      return
    }
    setShowBulkApproveModal(true)
  }

  const handleBulkApproveConfirm = async () => {
    try {
      setIsBulkApproving(true)
      setShowBulkApproveModal(false)
      const results = await bulkApproveWork(Array.from(selectedApplications))
      const successCount = results.successful?.length || 0
      const failCount = results.failed?.length || 0

      if (successCount > 0) {
        toast.success(`Successfully approved ${successCount} application(s)!`)
      }
      if (failCount > 0) {
        toast.error(`${failCount} application(s) failed to approve.`)
      }

      setSelectedApplications(new Set())
      fetchApplications()
    } catch (error: any) {
      console.error('Error bulk approving work:', error)
      toast.error(error.response?.data?.error || 'Failed to bulk approve work')
    } finally {
      setIsBulkApproving(false)
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getWorkValidationStatus = (app: any): 'pending' | 'approved' | 'rejected' => {
    if (app.workApprovedByVendor) return 'approved'
    if (app.workRejectionReason) return 'rejected'
    return 'pending'
  }

  const filteredApplications = applications.filter((app) => {
    if (workStatusFilter === 'all') return true
    return getWorkValidationStatus(app) === workStatusFilter
  })

  const handleApproveAndReview = async (app: any) => {
    try {
      await approveWork(app.id)
      toast.success('Work approved successfully')
      fetchApplications()
    } catch (error: any) {
      console.error('Error approving work:', error)
      toast.error(error.response?.data?.error || 'Failed to approve work')
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-green-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-2 sm:p-4 lg:p-6">
        <div className="w-full mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.back()}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 transition-colors"
                >
                  <FaArrowLeft className="mr-2" />
                  Back
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Work Validation
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Review and approve completed work from partners
                </p>
              </div>
            </div>
          </div>

          {/* Stats Banner */}
          {applications.length > 0 && (() => {
            const pendingCount = applications.filter((app: any) => getWorkValidationStatus(app) === 'pending').length
            const approvedCount = applications.filter((app: any) => getWorkValidationStatus(app) === 'approved').length
            const rejectedCount = applications.filter((app: any) => getWorkValidationStatus(app) === 'rejected').length
            return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {pagination?.total || applications.length} Application{(pagination?.total || applications.length) !== 1 ? 's' : ''} with Completed Work
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(() => {
                      if (pendingCount > 0 || approvedCount > 0 || rejectedCount > 0) {
                        const parts: string[] = []
                        if (pendingCount > 0) parts.push(`${pendingCount} pending`)
                        if (approvedCount > 0) parts.push(`${approvedCount} approved`)
                        if (rejectedCount > 0) parts.push(`${rejectedCount} rejected`)
                        return parts.join(', ')
                      }
                      return 'No completed work yet'
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {pendingCount > 0 && (
                    <>
                      <button
                        onClick={handleSelectAll}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        {selectedApplications.size === applications.filter((app: any) => !app.workApprovedByVendor).length ? 'Deselect All' : 'Select All Pending'}
                      </button>
                      <button
                        onClick={handleBulkApproveWork}
                        disabled={isBulkApproving || selectedApplications.size === 0}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        {isBulkApproving ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle />
                            Approve Selected ({selectedApplications.size})
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            )
          })()}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by partner name, email, or campaign..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      fetchApplications(1, limit)
                    }
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                />
              </div>
              <select
                value={filterCampaign}
                onChange={(e) => {
                  setFilterCampaign(e.target.value)
                }}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
              <select
                value={workStatusFilter}
                onChange={(e) => setWorkStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              >
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Statuses</option>
              </select>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 ${
                    viewMode === 'table'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                  title="Table view"
                >
                  <FaList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 ${
                    viewMode === 'cards'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                  title="Card view"
                >
                  <FaTh className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Applications List */}
          {filteredApplications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-lg">
              <FaCheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Completed Work Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filterCampaign !== 'all' || workStatusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No partners have marked their work as complete yet. Completed work will appear here when partners submit their deliverables.'}
              </p>
            </div>
          ) : (
            <>
            {viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={(() => {
                            const pendingApps = applications.filter((app: any) => !app.workApprovedByVendor)
                            return selectedApplications.size === pendingApps.length && pendingApps.length > 0
                          })()}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          disabled={applications.filter((app: any) => !app.workApprovedByVendor).length === 0}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Partner
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Completed Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Submissions
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredApplications.map((app) => {
                      const isSelected = selectedApplications.has(app.id)
                      const totalPosts = app.posts?.length || 0
                      const validatedCount =
                        Array.isArray(app.posts) ? app.posts.filter((p: any) => p.validated).length : 0
                      return (
                        <tr
                          key={app.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            isSelected ? 'bg-green-100 dark:bg-green-900/30' : ''
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectApplication(app.id)}
                              disabled={app.workApprovedByVendor}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {app.partner?.picture ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                    src={app.partner.picture}
                                    alt={app.partner.name || 'Partner'}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                      const parent = target.parentElement
                                      if (parent) {
                                        const fallback = document.createElement('div')
                                        const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-red-600', 'bg-yellow-600', 'bg-teal-600', 'bg-orange-600', 'bg-cyan-600']
                                        const str = app.partner?.name || app.partner?.id || 'A'
                                        let hash = 0
                                        for (let i = 0; i < str.length; i++) {
                                          hash = str.charCodeAt(i) + ((hash << 5) - hash)
                                        }
                                        const color = colors[Math.abs(hash) % colors.length]
                                        const initials = app.partner?.name ? (app.partner.name.split(' ').length >= 2 ? (app.partner.name.split(' ')[0][0] + app.partner.name.split(' ')[app.partner.name.split(' ').length - 1][0]).toUpperCase() : app.partner.name.charAt(0).toUpperCase()) : 'P'
                                        fallback.className = `h-10 w-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 dark:border-gray-600`
                                        fallback.textContent = initials
                                        parent.appendChild(fallback)
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className={`h-10 w-10 rounded-full ${(() => {
                                    const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-red-600', 'bg-yellow-600', 'bg-teal-600', 'bg-orange-600', 'bg-cyan-600']
                                    const str = app.partner?.name || app.partner?.id || 'A'
                                    let hash = 0
                                    for (let i = 0; i < str.length; i++) {
                                      hash = str.charCodeAt(i) + ((hash << 5) - hash)
                                    }
                                    return colors[Math.abs(hash) % colors.length]
                                  })()} flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 dark:border-gray-600`}>
                                    {app.partner?.name ? (app.partner.name.split(' ').length >= 2 ? (app.partner.name.split(' ')[0][0] + app.partner.name.split(' ')[app.partner.name.split(' ').length - 1][0]).toUpperCase() : app.partner.name.charAt(0).toUpperCase()) : 'P'}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {app.partner?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {app.partner?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link
                              href={`/admin/campaigns/${app.campaign.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center"
                            >
                              <FaBriefcase className="mr-2" />
                              {app.campaign?.title || 'Unknown Campaign'}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {app.workCompletedAt ? formatDate(app.workCompletedAt) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {totalPosts > 0 ? (
                              <div className="flex flex-col gap-1">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium w-fit">
                                  {totalPosts} Post{totalPosts !== 1 ? 's' : ''}
                                  {validatedCount > 0 && ` • ${validatedCount} validated`}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {app.posts.slice(0, 3).map((post: any) => (
                                    <span
                                      key={post.id}
                                      className={`px-1.5 py-0.5 text-xs rounded ${
                                        post.validated
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      }`}
                                      title={`${post.platform} - ${post.validated ? 'Validated' : 'Not Validated'}`}
                                    >
                                      {post.platform}
                                    </span>
                                  ))}
                                  {app.posts.length > 3 && (
                                    <span className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                                      +{app.posts.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">No posts</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {getWorkValidationStatus(app) === 'approved' ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                <FaCheckCircle className="h-3 w-3" />
                                Approved
                              </span>
                            ) : getWorkValidationStatus(app) === 'rejected' ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                <FaClock className="h-3 w-3" />
                                Rejected
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                <FaClock className="h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/work-validation/${app.id}`}
                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900 inline-flex items-center gap-1"
                                title="Review Details"
                              >
                                <FaEye />
                                <span>Details</span>
                              </Link>
                              {getWorkValidationStatus(app) === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveAndReview(app)}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center gap-1"
                                >
                                  <FaCheckCircle className="h-3 w-3" />
                                  Approve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  {/* Mobile prev/next */}
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => fetchApplications(pagination.page - 1, pagination.limit)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchApplications(pagination.page + 1, pagination.limit)}
                      disabled={pagination.page === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>

                  {/* Desktop summary + prev/next */}
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">
                        {applications.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.limit + applications.length}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => fetchApplications(pagination.page - 1, pagination.limit)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchApplications(pagination.page + 1, pagination.limit)}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredApplications.map((app) => {
                  const totalPosts = app.posts?.length || 0
                  const validatedCount =
                    Array.isArray(app.posts) ? app.posts.filter((p: any) => p.validated).length : 0
                  const status = getWorkValidationStatus(app)
                  const isSelected = selectedApplications.has(app.id)
                  const isPending = status === 'pending'
                  return (
                    <div
                      key={app.id}
                      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${
                        isSelected ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-transparent' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10">
                            {app.partner?.picture ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                src={app.partner.picture}
                                alt={app.partner.name || 'Partner'}
                              />
                            ) : (
                              <div className={`h-10 w-10 rounded-full ${(() => {
                                const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-red-600', 'bg-yellow-600', 'bg-teal-600', 'bg-orange-600', 'bg-cyan-600']
                                const str = app.partner?.name || app.partner?.id || 'A'
                                let hash = 0
                                for (let i = 0; i < str.length; i++) {
                                  hash = str.charCodeAt(i) + ((hash << 5) - hash)
                                }
                                return colors[Math.abs(hash) % colors.length]
                              })()} flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 dark:border-gray-600`}>
                                {app.partner?.name?.charAt(0) || 'P'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {app.partner?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {app.campaign?.title || 'Unknown Campaign'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          {status === 'approved' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium flex items-center gap-1">
                              <FaCheckCircle className="h-3 w-3" />
                              Approved
                            </span>
                          ) : status === 'rejected' ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium flex items-center gap-1">
                              <FaClock className="h-3 w-3" />
                              Rejected
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium flex items-center gap-1">
                              <FaClock className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                          {/* Card-level selection checkbox (only for pending, like table view) */}
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!isPending || app.workApprovedByVendor}
                            checked={isSelected}
                            onChange={() => handleSelectApplication(app.id)}
                          />
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Completed:{' '}
                        {app.workCompletedAt ? formatDate(app.workCompletedAt) : 'N/A'}
                      </div>

                      <div className="mb-3">
                        {totalPosts > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium w-fit">
                              {totalPosts} Post{totalPosts !== 1 ? 's' : ''}
                              {validatedCount > 0 && ` • ${validatedCount} validated`}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {app.posts.slice(0, 3).map((post: any) => (
                                <span
                                  key={post.id}
                                  className={`px-1.5 py-0.5 text-xs rounded ${
                                    post.validated
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  }`}
                                >
                                  {post.platform}
                                </span>
                              ))}
                              {app.posts.length > 3 && (
                                <span className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                                  +{app.posts.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            No posts submitted
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <Link
                          href={`/admin/work-validation/${app.id}`}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <FaEye className="h-3 w-3" />
                          View details
                        </Link>
                        {status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleApproveAndReview(app)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center gap-1"
                          >
                            <FaCheckCircle className="h-3 w-3" />
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Bulk Approve Confirmation Modal */}
      {showBulkApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowBulkApproveModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-green-200 dark:border-green-500/20 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Approve Work</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to approve work for <span className="font-semibold">{selectedApplications.size}</span> application(s)? Earnings will be set for each approved application.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkApproveModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkApproveConfirm}
                disabled={isBulkApproving || selectedApplications.size === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                {isBulkApproving ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaCheckCircle className="h-3.5 w-3.5" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default WorkValidationPage
