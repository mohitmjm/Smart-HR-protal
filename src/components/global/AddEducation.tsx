'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  PlusIcon, 
  XMarkIcon, 
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { IEducation } from '@/models/Education'
import { formInputs, buttons } from '@/lib/utils'

interface EducationFormData {
  schoolOrUniversity: string
  degree: 'Bachelors' | 'Masters' | 'Other'
  fieldOfStudy: string
  overallResult: string
  startDate: string
  endDate: string
}

interface AddEducationProps {
  onEducationChange?: (educations: IEducation[]) => void
  className?: string
  showExisting?: boolean
  maxEducations?: number
}

const blankForm = (): EducationFormData => ({
  schoolOrUniversity: '',
  degree: 'Bachelors',
  fieldOfStudy: '',
  overallResult: '',
  startDate: '',
  endDate: ''
})

type Draft = {
  tempId: string
  form: EducationFormData
  editingId?: string | null
  loading?: boolean
  error?: string | null
  success?: string | null
}

const AddEducation: React.FC<AddEducationProps> = ({
  onEducationChange,
  className = '',
  showExisting = true,
  maxEducations = 10
}) => {
  const [educations, setEducations] = useState<IEducation[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null)

  // Fetch existing education records
  useEffect(() => {
    if (showExisting) {
      fetchEducations()
    }
  }, [showExisting])

  const fetchEducations = async () => {
    try {
      const response = await fetch('/api/education')
      const result = await response.json()
      if (result.success) {
        setEducations(result.data)
        onEducationChange?.(result.data)
      } else {
        setGlobalError('Failed to fetch education records')
      }
    } catch {
      setGlobalError('Error fetching education records')
    }
  }

  const addNewDraft = () => {
    setDrafts(prev => {
      if (educations.length + prev.length >= maxEducations) return prev
      return [
        ...prev,
        { tempId: crypto.randomUUID(), form: blankForm(), editingId: null, loading: false, error: null, success: null }
      ]
    })
    setTimeout(() => firstFieldRef.current?.focus(), 0)
  }

  const handleInputChange = (tempId: string, name: keyof EducationFormData, value: string) => {
    setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, form: { ...d.form, [name]: value } } : d))
  }

  const validateForm = (form: EducationFormData): string | null => {
    if (!form.schoolOrUniversity.trim()) return 'School or University is required'
    if (!form.degree) return 'Degree is required'
    return null
  }

  const handleSubmit = async (e: React.FormEvent, tempId: string) => {
    e.preventDefault()
    setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, error: null, success: null } : d))

    const draft = drafts.find(d => d.tempId === tempId)
    if (!draft) return

    const validation = validateForm(draft.form)
    if (validation) {
      setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, error: validation } : d))
      return
    }

    try {
      setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, loading: true } : d))
      const url = draft.editingId ? `/api/education/${draft.editingId}` : '/api/education'
      const method = draft.editingId ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft.form)
      })
      const result = await response.json()
      if (result.success) {
        if (draft.editingId) {
          setEducations(prev => prev.map(edu => String((edu as any)._id) === String(draft.editingId) ? result.data : edu))
          setRecentlyUpdatedId(String(draft.editingId))
          setTimeout(() => setRecentlyUpdatedId(null), 1200)
        } else {
          setEducations(prev => [result.data, ...prev])
        }
        onEducationChange?.(draft.editingId ? educations.map(edu => String((edu as any)._id) === String(draft.editingId) ? result.data : edu) : [result.data, ...educations])
        await fetchEducations()
        // Remove the draft after successful save
        setDrafts(prev => prev.filter(d => d.tempId !== tempId))
      } else {
        setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, error: result.error || 'Failed to save education' } : d))
      }
    } catch {
      setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, error: 'Error saving education' } : d))
    } finally {
      setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, loading: false } : d))
    }
  }

  const handleCancel = (tempId: string) => {
    setDrafts(prev => prev.filter(d => d.tempId !== tempId))
  }

  const handleEdit = (education: IEducation) => {
    setDrafts(prev => [
      {
        tempId: crypto.randomUUID(),
        form: {
          schoolOrUniversity: education.schoolOrUniversity,
          degree: education.degree,
          fieldOfStudy: education.fieldOfStudy || '',
          overallResult: education.overallResult || '',
          startDate: education.startDate ? new Date(education.startDate).toISOString().split('T')[0] : '',
          endDate: education.endDate ? new Date(education.endDate).toISOString().split('T')[0] : ''
        },
        editingId: String(education._id),
        loading: false,
        error: null,
        success: null
      },
      ...prev
    ])
    setTimeout(() => firstFieldRef.current?.focus(), 0)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/education/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        setEducations(prev => prev.filter(edu => String((edu as any)._id) !== id))
        onEducationChange?.(educations.filter(edu => String((edu as any)._id) !== id))
        if (showExisting) {
          await fetchEducations()
        }
        setConfirmDeleteId(null)
      } else {
        setGlobalError(result.error || 'Failed to delete education')
      }
    } catch {
      setGlobalError('Error deleting education')
    }
  }

  const canAddMore = educations.length + drafts.length < maxEducations

  // Compute ids currently being edited
  const editingIdSet = new Set(
    drafts.filter(d => d.editingId).map(d => String(d.editingId))
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Education</h3>
            <p className="text-sm sm:text-base text-gray-600">Your academic qualifications and achievements</p>
          </div>
        </div>
        {canAddMore && (
          <button
            type="button"
            onClick={addNewDraft}
            className={`${buttons.primary} w-full sm:w-auto`}
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Add education</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {globalError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{globalError}</span>
        </div>
      )}

      {/* Draft Forms */}
      {drafts.map((draft, idx) => (
        <form key={draft.tempId} onSubmit={(e) => handleSubmit(e, draft.tempId)} className="bg-gray-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label htmlFor={`schoolOrUniversity-${draft.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">
                School or University *
              </label>
              <input
                ref={idx === 0 ? firstFieldRef : undefined}
                type="text"
                id={`schoolOrUniversity-${draft.tempId}`}
                name="schoolOrUniversity"
                value={draft.form.schoolOrUniversity}
                onChange={(e) => handleInputChange(draft.tempId, 'schoolOrUniversity', e.target.value)}
                className={formInputs.input}
                placeholder="Enter school or university name"
                required
              />
            </div>
            <div>
              <label htmlFor={`degree-${draft.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">
                Degree *
              </label>
              <select
                id={`degree-${draft.tempId}`}
                name="degree"
                value={draft.form.degree}
                onChange={(e) => handleInputChange(draft.tempId, 'degree', e.target.value)}
                className={formInputs.select}
                required
              >
                <option value="Bachelors">Bachelors</option>
                <option value="Masters">Masters</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor={`fieldOfStudy-${draft.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">
                Field of Study
              </label>
              <input
                type="text"
                id={`fieldOfStudy-${draft.tempId}`}
                name="fieldOfStudy"
                value={draft.form.fieldOfStudy}
                onChange={(e) => handleInputChange(draft.tempId, 'fieldOfStudy', e.target.value)}
                className={formInputs.input}
                placeholder="e.g., Computer Science, Business Administration"
              />
            </div>
            <div>
              <label htmlFor={`overallResult-${draft.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">
                Overall Result (CGPA)
              </label>
              <input
                type="text"
                id={`overallResult-${draft.tempId}`}
                name="overallResult"
                value={draft.form.overallResult}
                onChange={(e) => handleInputChange(draft.tempId, 'overallResult', e.target.value)}
                className={formInputs.input}
                placeholder="e.g., 3.8/4.0, First Class, 85%"
              />
            </div>
            <div>
              <label htmlFor={`startDate-${draft.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id={`startDate-${draft.tempId}`}
                name="startDate"
                value={draft.form.startDate}
                onChange={(e) => handleInputChange(draft.tempId, 'startDate', e.target.value)}
                className={formInputs.input}
              />
            </div>
            <div>
              <label htmlFor={`endDate-${draft.tempId}`} className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id={`endDate-${draft.tempId}`}
                name="endDate"
                value={draft.form.endDate}
                onChange={(e) => handleInputChange(draft.tempId, 'endDate', e.target.value)}
                className={formInputs.input}
              />
            </div>
          </div>

          {draft.error && (
            <div className="mt-3 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">{draft.error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={() => handleCancel(draft.tempId)}
              className={`${buttons.secondary} w-full sm:w-auto`}
              disabled={!!draft.loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${buttons.primary} w-full sm:w-auto`}
              disabled={!!draft.loading}
            >
              {draft.loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">Save</span>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      ))}

      {/* Education List */}
      {showExisting && educations.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {educations.map((education) => {
            const idStr = String((education as any)._id)
            if (editingIdSet.has(idStr)) {
              // Hide the saved card while it's being edited
              return null
            }
            return (
              <div
                key={String(education._id)}
                className={
                  `p-4 sm:p-6 rounded-lg sm:rounded-xl border shadow-sm transition-colors duration-700 ${
                    recentlyUpdatedId === String((education as any)._id)
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`
                }
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {education.schoolOrUniversity}
                      </h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full w-fit">
                        {education.degree}
                      </span>
                    </div>
                    {education.fieldOfStudy && (
                      <p className="text-sm sm:text-base text-gray-600 mb-1">
                        <span className="font-medium">Field:</span> {education.fieldOfStudy}
                      </p>
                    )}
                    {education.overallResult && (
                      <p className="text-sm sm:text-base text-gray-600 mb-1">
                        <span className="font-medium">Result:</span> {education.overallResult}
                      </p>
                    )}
                    {(education.startDate || education.endDate) && (
                      <p className="text-xs sm:text-sm text-gray-500">
                        {education.startDate && new Date(education.startDate).getFullYear()}
                        {education.startDate && education.endDate && ' - '}
                        {education.endDate && new Date(education.endDate).getFullYear()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-end sm:justify-start space-x-2 sm:ml-4">
                    {confirmDeleteId === idStr ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <span className="text-xs sm:text-sm text-red-600">Delete this record?</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(idStr)}
                            className={`${buttons.danger} text-xs px-2 py-1`}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className={`${buttons.secondary} text-xs px-2 py-1`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEdit(education)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit education"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(idStr)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete education"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {showExisting && educations.length === 0 && drafts.length === 0 && (
        <div className="text-center py-6 sm:py-8 text-gray-500">
          <AcademicCapIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
          <p className="text-sm sm:text-base">No education records added yet.</p>
        </div>
      )}
    </div>
  )
}

export default AddEducation
