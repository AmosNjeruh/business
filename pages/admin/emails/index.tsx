import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/admin/Layout'
import { getVendorEmailRecipients, sendVendorEmails } from '@/services/vendor'
import {
  FaEnvelope,
  FaUsers,
  FaCheck,
  FaPaperPlane,
  FaEdit,
  FaEye,
  FaCode,
  FaUserCheck,
  FaSearch,
  FaInbox,
  FaTag,
  FaSpinner,
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import Image from 'next/image'

const VendorEmailsPage: React.FC = () => {
  const [recipients, setRecipients] = useState<any[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [recipientType, setRecipientType] = useState<'brand' | 'partner'>('partner')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Email form states
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Fetch recipients on component mount and when filters change
  const fetchRecipients = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        type: recipientType,
      }

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery
      }

      const result = await getVendorEmailRecipients(params)
      setRecipients(result.data?.recipients || [])
    } catch (error: any) {
      console.error('Error fetching recipients:', error)
      toast.error('Error fetching recipients. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [recipientType, debouncedSearchQuery])

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 2000)
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  useEffect(() => {
    fetchRecipients()
  }, [fetchRecipients])

  // Filter recipients based on search query (client-side filtering for instant feedback)
  const filteredRecipients = recipients.filter((recipient) => {
    if (!searchQuery.trim()) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      recipient.name?.toLowerCase().includes(searchLower) ||
      recipient.email?.toLowerCase().includes(searchLower)
    )
  })

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecipients([])
    } else {
      setSelectedRecipients(filteredRecipients.map((recipient) => recipient.id))
    }
    setSelectAll(!selectAll)
  }

  // Handle individual recipient selection
  const handleRecipientSelection = (recipientId: string) => {
    if (selectedRecipients.includes(recipientId)) {
      setSelectedRecipients(selectedRecipients.filter((id) => id !== recipientId))
    } else {
      setSelectedRecipients([...selectedRecipients, recipientId])
    }
  }

  // Update select all state when individual selections change
  useEffect(() => {
    if (selectedRecipients.length === filteredRecipients.length && filteredRecipients.length > 0) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedRecipients, filteredRecipients])

  // Handle email sending
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedRecipients.length === 0) {
      toast.error(`Please select at least one ${recipientType}`)
      return
    }

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in both subject and message')
      return
    }

    setSending(true)
    const loadingToast = toast.loading(`Sending emails to ${selectedRecipients.length} ${recipientType}(s)...`)
    
    try {
      const result = await sendVendorEmails({
        recipients: selectedRecipients,
        subject: subject.trim(),
        message: message.trim(),
        isHtml: isHtmlMode,
        recipientType,
      })

      toast.dismiss(loadingToast)

      if (result.success && result.data) {
        const successCount = result.data.sentTo?.length || 0
        const failedCount = result.data.failed?.length || 0

        if (successCount > 0) {
          toast.success(
            `Email sent successfully to ${successCount} ${recipientType}(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
            { duration: 5000 }
          )
        }

        if (failedCount > 0) {
          toast.error(
            `Failed to send to ${failedCount} ${recipientType}(s). Check the details and try again.`,
            { duration: 7000 }
          )
        }

        // Reset form if all emails were successful
        if (failedCount === 0 && successCount === selectedRecipients.length) {
          setSubject('')
          setMessage('')
          setSelectedRecipients([])
          setSelectAll(false)
        }
      } else {
        toast.error((result as any).error || 'Failed to send emails. Please check your configuration and try again.')
      }
    } catch (error: any) {
      console.error('Error sending emails:', error)
      toast.dismiss(loadingToast)
      
      const errorMessage = error?.response?.data?.error || error?.message || 'Error sending emails. Please try again.'
      toast.error(errorMessage, { duration: 7000 })
    } finally {
      setSending(false)
    }
  }

  // Generate preview content
  const getPreviewContent = () => {
    const content = isHtmlMode ? message : message.replace(/\n/g, '<br>')
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="padding: 30px 20px;">
          <p>Hello [${recipientType === 'brand' ? 'Brand' : 'Partner'} Name],</p>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ea5b0c;">
            ${content}
          </div>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>[Your Brand Name] Team</p>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 14px; color: #666666; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
          <p>This email was sent via Trend360 on behalf of [Your Brand Name].</p>
          <p>&copy; ${new Date().getFullYear()} trend360.net All rights reserved.</p>
        </div>
      </div>
    `
  }

  // Get placeholder preview
  const getPlaceholderPreview = () => {
    if (selectedRecipients.length === 0) return null

    const selectedRecipientData = recipients.filter((r) => selectedRecipients.includes(r.id))
    if (selectedRecipientData.length === 0) return null

    // Show preview for first selected recipient
    const recipient = selectedRecipientData[0]
    let previewMessage = message

    const replacements: Record<string, string> = {
      '{vendor-name}': 'Your Brand',
      '{brand-name}': recipient.name || 'Brand',
      '{partner-name}': recipient.name || 'Partner',
      '{user-name}': recipient.name || 'User',
      '{user-email}': recipient.email,
      '{brand-email}': recipient.email,
      '{partner-email}': recipient.email,
      '{vendor-subdomain}': 'your-brand.civrot.com',
      '{brand-subdomain}': recipient.vendorSlug ? `${recipient.vendorSlug}.civrot.com` : recipient.partnerSlug ? `${recipient.partnerSlug}.civrot.com` : 'No subdomain',
      '{partner-subdomain}': recipient.partnerSlug ? `${recipient.partnerSlug}.civrot.com` : 'No subdomain',
      '{vendor-store-url}': 'https://your-brand.civrot.com',
    }

    Object.entries(replacements).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      previewMessage = previewMessage.replace(regex, value)
    })

    return previewMessage
  }

  // Insert placeholder into textarea
  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end)

      textarea.value = before + placeholder + after
      textarea.focus()
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length)

      // Update the message state
      setMessage(textarea.value)
    }
  }

  // Reset selections when recipient type changes
  useEffect(() => {
    setSelectedRecipients([])
    setSelectAll(false)
  }, [recipientType])

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
                Communication
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Send emails to brands you manage or partners who have interacted with you
            </p>
            {!loading && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Showing <span className="font-semibold text-emerald-600 dark:text-emerald-400">{filteredRecipients.length}</span> {recipientType}{filteredRecipients.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {/* Navigation buttons */}
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Link
              href="/admin/emails/history"
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <FaInbox className="mr-2" />
              Email History
            </Link>
          </div>
        </div>

        {/* Recipient Type Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Send to:</span>
          <button
            onClick={() => {
              setRecipientType('brand')
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              recipientType === 'brand'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Brands
          </button>
          <button
            onClick={() => {
              setRecipientType('partner')
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              recipientType === 'partner'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Partners
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Composition */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mr-3">
                <FaEdit size={18} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Compose Email</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedRecipients.length} {recipientType}(s) selected
                </p>
              </div>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter email subject..."
                  required
                />
              </div>

              {/* Content Type Toggle */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsHtmlMode(!isHtmlMode)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                    isHtmlMode
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FaCode size={14} />
                  HTML Mode
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                    previewMode
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FaEye size={14} />
                  Preview
                </button>
              </div>

              {/* Message */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                  Message
                </label>

                {/* Placeholder buttons */}
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Quick insert:</span>
                  {recipientType === 'brand' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => insertPlaceholder('{brand-name}')}
                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1"
                      >
                        <FaTag size={10} />
                        Brand Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertPlaceholder('{brand-email}')}
                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1"
                      >
                        <FaTag size={10} />
                        Email
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => insertPlaceholder('{partner-name}')}
                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1"
                      >
                        <FaTag size={10} />
                        Partner Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertPlaceholder('{partner-email}')}
                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1"
                      >
                        <FaTag size={10} />
                        Email
                      </button>
                    </>
                  )}
                </div>

                {/* Placeholder Preview */}
                {selectedRecipients.length > 0 && message && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Preview for first selected {recipientType}:
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{getPlaceholderPreview()}</div>
                  </div>
                )}

                {previewMode ? (
                  <div
                    className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                  />
                ) : (
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-vertical"
                    placeholder={
                      isHtmlMode
                        ? `Enter HTML content... Use {${recipientType}-name}, {${recipientType}-email}, etc. for dynamic content`
                        : `Enter your message... Use {${recipientType}-name}, {${recipientType}-email}, etc. for dynamic content`
                    }
                    required
                  />
                )}
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={sending || selectedRecipients.length === 0}
                className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {sending ? (
                  <>
                    <FaSpinner className="animate-spin" size={16} />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={16} />
                    Send Email to {selectedRecipients.length} {recipientType === 'brand' ? 'Brand' : 'Partner'}(s)
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recipient Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400 mr-3">
                    <FaUsers size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Select {recipientType === 'brand' ? 'Brands' : 'Partners'}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {filteredRecipients.length} {recipientType}(s) available
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder={`Search ${recipientType}s...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FaSearch size={16} />
                </div>
              </div>

              {/* Select All */}
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Select all ({filteredRecipients.length})
                </label>
              </div>
            </div>

            {/* Recipient List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredRecipients.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No {recipientType}s found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRecipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={recipient.id}
                          checked={selectedRecipients.includes(recipient.id)}
                          onChange={() => handleRecipientSelection(recipient.id)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-3">
                              {recipient.picture ? (
                                <Image
                                  src={recipient.picture}
                                  alt={recipient.name || 'User'}
                                  width={32}
                                  height={32}
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                  <FaUserCheck size={14} />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                {recipient.name || 'Unknown'}
                                {recipient.verified && (
                                  <FaCheck className="ml-2 text-green-500" size={12} />
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{recipient.email}</div>
                              {recipient.vendorSlug && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  <a
                                    href={`https://${recipient.vendorSlug}.civrot.com`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {recipient.vendorSlug}.civrot.com
                                  </a>
                                </div>
                              )}
                              {recipient.partnerSlug && (
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  {recipient.partnerSlug}.civrot.com
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default VendorEmailsPage
