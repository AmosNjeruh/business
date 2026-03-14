// Business Suite – Work Validation
// Route: /admin/work-validation
// Smart work validation with powerful tools for efficiency

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/Layout'
import { getCampaigns, getApplications, approveWork, bulkApproveWork } from '@/services/vendor'
import Image from 'next/image'
import SocialEmbed from '@/components/admin/SocialEmbeds'
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
  FaTimes,
  FaDownload,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaBolt,
  FaChartBar,
  FaCheckDouble,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaKeyboard,
  FaExpand,
} from 'react-icons/fa'

type SortField = 'date' | 'partner' | 'campaign' | 'posts' | 'status'
type SortDirection = 'asc' | 'desc'

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filterCampaign, setFilterCampaign] = useState('all')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false)
  const [workStatusFilter, setWorkStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showQuickPreview, setShowQuickPreview] = useState<string | null>(null)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement
        searchInput?.focus()
      }
      // Ctrl/Cmd + A for select all pending
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        handleSelectAll()
      }
      // Ctrl/Cmd + Enter for bulk approve
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && selectedApplications.size > 0) {
        e.preventDefault()
        handleBulkApproveWork()
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowBulkApproveModal(false)
        setShowQuickPreview(null)
        setShowKeyboardShortcuts(false)
      }
      // ? for keyboard shortcuts help
      if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setShowKeyboardShortcuts(!showKeyboardShortcuts)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedApplications.size])

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

  const fetchApplications = useCallback(async (pageOverride?: number, limitOverride?: number) => {
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
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim()

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
  }, [filterCampaign, workStatusFilter, debouncedSearchTerm, limit, page, router])

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 400)
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  useEffect(() => {
    fetchApplications(1, limit)
  }, [filterCampaign, workStatusFilter, debouncedSearchTerm, limit])

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

  // Calculate stats
  const stats = useMemo(() => {
    const pending = applications.filter((app) => getWorkValidationStatus(app) === 'pending').length
    const approved = applications.filter((app) => getWorkValidationStatus(app) === 'approved').length
    const rejected = applications.filter((app) => getWorkValidationStatus(app) === 'rejected').length
    const totalPosts = applications.reduce((sum, app) => sum + (app.posts?.length || 0), 0)
    const validatedPosts = applications.reduce((sum, app) => {
      return sum + (app.posts?.filter((p: any) => p.validated).length || 0)
    }, 0)

    return { pending, approved, rejected, totalPosts, validatedPosts }
  }, [applications])

  // Sort applications
  const sortedApplications = useMemo(() => {
    const sorted = [...applications].sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortField) {
        case 'date':
          aVal = new Date(a.workCompletedAt || a.createdAt).getTime()
          bVal = new Date(b.workCompletedAt || b.createdAt).getTime()
          break
        case 'partner':
          aVal = (a.partner?.name || '').toLowerCase()
          bVal = (b.partner?.name || '').toLowerCase()
          break
        case 'campaign':
          aVal = (a.campaign?.title || '').toLowerCase()
          bVal = (b.campaign?.title || '').toLowerCase()
          break
        case 'posts':
          aVal = a.posts?.length || 0
          bVal = b.posts?.length || 0
          break
        case 'status':
          aVal = getWorkValidationStatus(a)
          bVal = getWorkValidationStatus(b)
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [applications, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <FaSort className="h-3 w-3 text-gray-400" />
    return sortDirection === 'asc' ? (
      <FaSortUp className="h-3 w-3 text-green-600" />
    ) : (
      <FaSortDown className="h-3 w-3 text-green-600" />
    )
  }

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

  const exportToCSV = () => {
    const headers = ['Partner', 'Campaign', 'Completed Date', 'Posts', 'Status', 'Validated Posts']
    const rows = sortedApplications.map((app) => [
      app.partner?.name || 'Unknown',
      app.campaign?.title || 'Unknown',
      app.workCompletedAt ? formatDate(app.workCompletedAt) : 'N/A',
      (app.posts?.length || 0).toString(),
      getWorkValidationStatus(app),
      (app.posts?.filter((p: any) => p.validated).length || 0).toString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `work-validation-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export started')
  }

  const quickPreviewApp = sortedApplications.find((app) => app.id === showQuickPreview)

  return (
    <AdminLayout>
      <div className="p-2 sm:p-4 lg:p-6">
        <div className="w-full mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 sm:p-6 border border-green-200 dark:border-green-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <FaArrowLeft className="mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Work Validation
                  </h1>
                  <button
                    onClick={() => setShowKeyboardShortcuts(true)}
                    className="ml-auto sm:ml-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Keyboard Shortcuts (Press ?)"
                  >
                    <FaKeyboard className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Review and approve completed work from partners
                </p>
              </div>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {pagination?.total || applications.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FaChartBar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.pending}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <FaClock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Approved</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.approved}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FaCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Posts</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalPosts}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <FaTh className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Validated</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.validatedPosts}/{stats.totalPosts}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <FaCheckDouble className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Toolbar */}
          {stats.pending > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Quick Actions
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {selectedApplications.size > 0
                      ? `${selectedApplications.size} selected • Press Ctrl+Enter to approve`
                      : `${stats.pending} pending reviews • Press Ctrl+A to select all`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    {selectedApplications.size === applications.filter((app: any) => !app.workApprovedByVendor).length
                      ? 'Deselect All'
                      : 'Select All Pending'}
                  </button>
                  <button
                    onClick={handleBulkApproveWork}
                    disabled={isBulkApproving || selectedApplications.size === 0}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isBulkApproving ? (
                      <>
                        <FaSpinner className="animate-spin h-4 w-4" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <FaBolt className="h-4 w-4" />
                        Approve Selected ({selectedApplications.size})
                      </>
                    )}
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <FaDownload className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by partner name, email, or campaign... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      fetchApplications(1, limit)
                    }
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all text-sm sm:text-base"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex flex-wrap gap-3">
                  <select
                    value={filterCampaign}
                    onChange={(e) => setFilterCampaign(e.target.value)}
                    className="flex-1 min-w-[150px] px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all text-sm"
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
                    className="flex-1 min-w-[150px] px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all text-sm"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All Statuses</option>
                  </select>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value))
                      setPage(1)
                    }}
                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all text-sm"
                  >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 transition-colors ${
                      viewMode === 'table'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                    title="Table view"
                  >
                    <FaList className="h-4 w-4" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                    title="Card view"
                  >
                    <FaTh className="h-4 w-4" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Applications List */}
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-12">
              <div className="flex justify-center items-center">
                <FaSpinner className="animate-spin text-3xl text-green-600" />
              </div>
            </div>
          ) : sortedApplications.length === 0 ? (
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
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
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
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort('partner')}
                          >
                            <div className="flex items-center gap-2">
                              Partner
                              <SortIcon field="partner" />
                            </div>
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort('campaign')}
                          >
                            <div className="flex items-center gap-2">
                              Campaign
                              <SortIcon field="campaign" />
                            </div>
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort('date')}
                          >
                            <div className="flex items-center gap-2">
                              Completed Date
                              <SortIcon field="date" />
                            </div>
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort('posts')}
                          >
                            <div className="flex items-center gap-2">
                              Submissions
                              <SortIcon field="posts" />
                            </div>
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center gap-2">
                              Status
                              <SortIcon field="status" />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedApplications.map((app) => {
                          const isSelected = selectedApplications.has(app.id)
                          const totalPosts = app.posts?.length || 0
                          const validatedCount =
                            Array.isArray(app.posts) ? app.posts.filter((p: any) => p.validated).length : 0
                          const status = getWorkValidationStatus(app)
                          return (
                            <tr
                              key={app.id}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''
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
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    {app.partner?.picture ? (
                                      <Image
                                        src={app.partner.picture}
                                        alt={app.partner.name || 'Partner'}
                                        width={40}
                                        height={40}
                                        className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                        }}
                                      />
                                    ) : (
                                      <div className={`h-10 w-10 rounded-full ${(() => {
                                        const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600']
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
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {app.partner?.name || 'Unknown'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {app.partner?.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Link
                                  href={`/admin/campaigns/${app.campaign.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                                >
                                  <FaBriefcase className="h-3 w-3" />
                                  <span className="truncate max-w-[200px]">{app.campaign?.title || 'Unknown Campaign'}</span>
                                </Link>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {app.workCompletedAt ? formatDate(app.workCompletedAt) : 'N/A'}
                              </td>
                              <td className="px-4 py-3">
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
                                          +{app.posts.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500 text-sm">No posts</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {status === 'approved' ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                    <FaCheckCircle className="h-3 w-3" />
                                    Approved
                                  </span>
                                ) : status === 'rejected' ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                    <FaExclamationTriangle className="h-3 w-3" />
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                    <FaClock className="h-3 w-3" />
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setShowQuickPreview(app.id)}
                                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 inline-flex items-center gap-1 transition-colors"
                                    title="Quick Preview"
                                  >
                                    <FaExpand className="h-4 w-4" />
                                    <span className="hidden sm:inline text-xs">Preview</span>
                                  </button>
                                  <Link
                                    href={`/admin/work-validation/${app.id}`}
                                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 inline-flex items-center gap-1 transition-colors"
                                    title="Review Details"
                                  >
                                    <FaEye className="h-4 w-4" />
                                    <span className="hidden sm:inline text-xs">Details</span>
                                  </Link>
                                  {status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => handleApproveAndReview(app)}
                                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                      <FaCheckCircle className="h-3 w-3" />
                                      <span className="hidden sm:inline">Approve</span>
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
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => fetchApplications(pagination.page - 1, pagination.limit)}
                            disabled={pagination.page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaChevronLeft className="h-4 w-4" />
                          </button>
                          <div className="flex items-center px-4 py-2 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Page {pagination.page} of {pagination.totalPages}
                          </div>
                          <button
                            onClick={() => fetchApplications(pagination.page + 1, pagination.limit)}
                            disabled={pagination.page === pagination.totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaChevronRight className="h-4 w-4" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedApplications.map((app) => {
                    const totalPosts = app.posts?.length || 0
                    const validatedCount =
                      Array.isArray(app.posts) ? app.posts.filter((p: any) => p.validated).length : 0
                    const status = getWorkValidationStatus(app)
                    const isSelected = selectedApplications.has(app.id)
                    const isPending = status === 'pending'
                    return (
                      <div
                        key={app.id}
                        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all ${
                          isSelected ? 'ring-2 ring-green-500 ring-offset-2' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 h-10 w-10">
                              {app.partner?.picture ? (
                                <Image
                                  src={app.partner.picture}
                                  alt={app.partner.name || 'Partner'}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <div className={`h-10 w-10 rounded-full ${(() => {
                                  const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600']
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
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {app.partner?.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {app.campaign?.title || 'Unknown Campaign'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 flex-shrink-0">
                            {status === 'approved' ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium flex items-center gap-1">
                                <FaCheckCircle className="h-3 w-3" />
                                Approved
                              </span>
                            ) : status === 'rejected' ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium flex items-center gap-1">
                                <FaExclamationTriangle className="h-3 w-3" />
                                Rejected
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium flex items-center gap-1">
                                <FaClock className="h-3 w-3" />
                                Pending
                              </span>
                            )}
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
                          Completed: {app.workCompletedAt ? formatDate(app.workCompletedAt) : 'N/A'}
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
                                    +{app.posts.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">No posts submitted</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 gap-2">
                          <button
                            onClick={() => setShowQuickPreview(app.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <FaExpand className="h-3 w-3" />
                            Preview
                          </button>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/work-validation/${app.id}`}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs font-medium inline-flex items-center gap-1"
                            >
                              <FaEye className="h-3 w-3" />
                              Details
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Approve Work</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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

      {/* Quick Preview Modal */}
      {showQuickPreview && quickPreviewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowQuickPreview(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {quickPreviewApp.partner?.name || 'Unknown Partner'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {quickPreviewApp.campaign?.title || 'Unknown Campaign'}
                  </p>
                </div>
                <button
                  onClick={() => setShowQuickPreview(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Submitted Posts</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickPreviewApp.posts?.slice(0, 6).map((post: any) => (
                      <div key={post.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-900 dark:text-white capitalize">{post.platform}</span>
                          {post.validated ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">Validated</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs">Pending</span>
                          )}
                        </div>
                        {post.caption && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{post.caption}</p>
                        )}
                        {post.link && (
                          <div className="mt-2">
                            <SocialEmbed url={post.link} platform={post.platform} className="w-full" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex gap-3">
              <Link
                href={`/admin/work-validation/${quickPreviewApp.id}`}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-center transition-colors"
              >
                View Full Details
              </Link>
              {getWorkValidationStatus(quickPreviewApp) === 'pending' && (
                <button
                  onClick={() => {
                    handleApproveAndReview(quickPreviewApp)
                    setShowQuickPreview(null)
                  }}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Quick Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowKeyboardShortcuts(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Focus Search</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+K</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Select All Pending</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+A</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bulk Approve Selected</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Show Shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default WorkValidationPage
