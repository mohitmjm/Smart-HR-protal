'use client'

import React, { useEffect, useRef, useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, ExclamationTriangleIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import { formInputs, buttons } from '@/lib/utils'

interface ExperienceItem {
  _id: string
  company: string
  title: string
  employmentType?: string
  location?: string
  startDate?: string
  endDate?: string
  description?: string
  isActive?: boolean
}

interface ExperienceForm {
  company: string
  title: string
  employmentType: string
  location: string
  startDate: string
  endDate: string
  description: string
}

const blankForm = (): ExperienceForm => ({ company: '', title: '', employmentType: '', location: '', startDate: '', endDate: '', description: '' })

interface Props {
  onChange?: (exp: ExperienceItem[]) => void
  className?: string
  showExisting?: boolean
  max?: number
}

export default function AddExperience({ onChange, className = '', showExisting = true, max = 20 }: Props) {
  const [items, setItems] = useState<ExperienceItem[]>([])
  const [drafts, setDrafts] = useState<Array<{ tempId: string; form: ExperienceForm; editingId?: string; loading?: boolean; error?: string | null }>>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const firstRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { if (showExisting) fetchItems() }, [showExisting])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/experience')
      const json = await res.json()
      if (json.success) { setItems(json.data); onChange?.(json.data) } else setError(json.error || 'Failed to fetch experience')
    } catch { setError('Error fetching experience') }
  }

  const addDraft = () => {
    setDrafts(prev => { if (items.length + prev.length >= max) return prev; return [...prev, { tempId: crypto.randomUUID(), form: blankForm(), loading: false, error: null }] })
    setTimeout(() => firstRef.current?.focus(), 0)
  }

  const handleInput = (tempId: string, name: keyof ExperienceForm, value: string) => {
    setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, form: { ...d.form, [name]: value } } : d))
  }

  const validate = (f: ExperienceForm) => { if (!f.company.trim()) return 'Company is required'; if (!f.title.trim()) return 'Title is required'; return null }

  const submit = async (e: React.FormEvent, tempId: string) => {
    e.preventDefault()
    const draft = drafts.find(d => d.tempId === tempId); if (!draft) return
    const v = validate(draft.form); if (v) { setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, error: v } : d)); return }
    try {
      setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, loading: true, error: null } : d))
      const url = draft.editingId ? `/api/experience/${draft.editingId}` : '/api/experience'
      const method = draft.editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft.form) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = (json as any)?.error || `${method} /api/experience failed (${res.status})`
        setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, error: msg } : d))
        return
      }
      if ((json as any).success) {
        if (draft.editingId) setItems(prev => prev.map(x => String((x as any)._id) === String(draft.editingId) ? (json as any).data : x))
        else setItems(prev => [(json as any).data, ...prev])
        const refreshed = await (async () => { await fetchItems(); return true })()
        if (refreshed) setDrafts(prev => prev.filter(d => d.tempId !== tempId))
      } else {
        setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, error: (json as any)?.error || 'Failed to save' } : d))
      }
    } catch (err) {
      setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, error: 'Network error while saving' } : d))
    } finally {
      setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, loading: false } : d))
    }
  }

  const cancel = (tempId: string) => setDrafts(prev => prev.filter(d => d.tempId !== tempId))

  const edit = (item: ExperienceItem) => {
    setDrafts(prev => [...prev, { tempId: crypto.randomUUID(), form: {
      company: item.company, title: item.title, employmentType: item.employmentType || '', location: item.location || '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '', endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '', description: item.description || ''
    }, editingId: item._id, loading: false, error: null }])
    setTimeout(() => firstRef.current?.focus(), 0)
  }

  const del = async (id: string) => {
    try { const res = await fetch(`/api/experience/${id}`, { method: 'DELETE' }); const json = await res.json(); if (json.success) { await fetchItems(); setConfirmDeleteId(null) } else setError(json.error || 'Failed to delete') } catch { setError('Error deleting') }
  }

  const editingIds = new Set(drafts.filter(d => d.editingId).map(d => String(d.editingId)))

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Work Experience</h3>
            <p className="text-sm sm:text-base text-gray-600">Your professional work history and achievements</p>
          </div>
        </div>
        <button type="button" onClick={addDraft} className={`${buttons.primary} w-full sm:w-auto`}>
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Add experience</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm">{error}</span>
        </div>
      )}

      {drafts.map(d => (
        <form key={d.tempId} onSubmit={(e) => submit(e, d.tempId)} className="bg-gray-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input ref={firstRef} type="text" value={d.form.company} onChange={(e) => handleInput(d.tempId, 'company', e.target.value)} className={formInputs.input} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" value={d.form.title} onChange={(e) => handleInput(d.tempId, 'title', e.target.value)} className={formInputs.input} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
              <input type="text" value={d.form.employmentType} onChange={(e) => handleInput(d.tempId, 'employmentType', e.target.value)} className={formInputs.input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={d.form.location} onChange={(e) => handleInput(d.tempId, 'location', e.target.value)} className={formInputs.input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={d.form.startDate} onChange={(e) => handleInput(d.tempId, 'startDate', e.target.value)} className={formInputs.input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={d.form.endDate} onChange={(e) => handleInput(d.tempId, 'endDate', e.target.value)} className={formInputs.input} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={d.form.description} onChange={(e) => handleInput(d.tempId, 'description', e.target.value)} className={formInputs.textarea} rows={3} />
            </div>
          </div>
          {d.error && (
            <div className="mt-3 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">{d.error}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-4 sm:mt-6">
            <button type="button" onClick={() => cancel(d.tempId)} className={`${buttons.secondary} w-full sm:w-auto`} disabled={!!d.loading}>Cancel</button>
            <button type="submit" className={`${buttons.primary} w-full sm:w-auto`} disabled={!!d.loading}>
              {d.loading ? (
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

      {showExisting && items.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {items.filter(Boolean).map((it, idx) => {
            const rawId = (it as any)?._id
            const hasId = !!rawId
            const idStr = hasId ? String(rawId) : `tmp-${idx}`
            if (editingIds.has(idStr)) return null
            return (
              <div key={idStr} className="p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{it.title}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full w-fit">{it.company}</span>
                    </div>
                    {it.employmentType && <p className="text-sm sm:text-base text-gray-600 mb-1"><span className="font-medium">Type:</span> {it.employmentType}</p>}
                    {it.location && <p className="text-sm sm:text-base text-gray-600 mb-1"><span className="font-medium">Location:</span> {it.location}</p>}
                    {(it.startDate || it.endDate) && (
                      <p className="text-xs sm:text-sm text-gray-500">
                        {it.startDate && new Date(it.startDate).getFullYear()}
                        {it.startDate && it.endDate && ' - '}
                        {it.endDate && new Date(it.endDate).getFullYear()}
                      </p>
                    )}
                    {it.description && <p className="text-sm sm:text-base text-gray-600 mt-2 whitespace-pre-line">{it.description}</p>}
                  </div>
                  <div className="flex items-center justify-end sm:justify-start space-x-2 sm:ml-4">
                    {hasId && confirmDeleteId === idStr ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <span className="text-xs sm:text-sm text-red-600">Delete this record?</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => del(idStr)} className={`${buttons.danger} text-xs px-2 py-1`}>Confirm</button>
                          <button type="button" onClick={() => setConfirmDeleteId(null)} className={`${buttons.secondary} text-xs px-2 py-1`}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => hasId && edit(it)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50" title="Edit experience" disabled={!hasId}><PencilIcon className="w-4 h-4" /></button>
                        <button type="button" onClick={() => hasId && setConfirmDeleteId(idStr)} className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50" title="Delete experience" disabled={!hasId}><TrashIcon className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
