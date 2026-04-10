'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Job = {
  _id: string
  title: string
  department: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience: 'entry' | 'mid' | 'senior' | 'lead'
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  salary: { min: number; max: number; currency: string }
  tags?: string[]
  contactEmail: string
  postedDate?: string
  deadline?: string
  isActive: boolean
}

type Department = {
  _id: string
  name: string
}

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [companyName, setCompanyName] = useState<string>('')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const [jobRes, deptRes, settingsRes] = await Promise.all([
          fetch(`/api/admin/jobs/${id}`),
          fetch('/api/admin/orgstructure/departments'),
          fetch('/api/admin/settings')
        ])
        
        if (jobRes.ok) {
          const jobData = await jobRes.json()
          if (jobData.success) {
            const d = jobData.data as Job & { company?: string }
            setJob({
              ...d,
              postedDate: d.postedDate ? d.postedDate.slice(0, 10) : '',
              deadline: d.deadline ? d.deadline.slice(0, 10) : '',
            })
          }
        }
        
        if (deptRes.ok) {
          const deptData = await deptRes.json()
          if (deptData.success) {
            setDepartments(deptData.data || [])
          }
        }
        
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          if (settingsData.success && settingsData.data?.general?.companyName) {
            setCompanyName(settingsData.data.general.companyName)
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load job')
      } finally {
        setLoading(false)
        setLoadingData(false)
      }
    }
    if (id) run()
  }, [id])

  const updateField = (name: string, value: any) => setJob(prev => prev ? { ...prev, [name]: value } : prev)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        experience: job.experience,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        benefits: job.benefits,
        salary: job.salary,
        tags: job.tags || [],
        company: companyName || 'Tielo',
        contactEmail: job.contactEmail,
        postedDate: job.postedDate ? new Date(job.postedDate).toISOString() : undefined,
        deadline: job.deadline ? new Date(job.deadline).toISOString() : undefined,
        isActive: job.isActive,
      }
      const res = await fetch(`/api/admin/jobs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update')
      router.push('/portal/admin/jobs')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async () => {
    if (!id) return
    if (!confirm('Delete this job?')) return
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete')
      router.push('/portal/admin/jobs')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-700">{error}</div>
  if (!job) return <div className="p-6">Not found</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Job</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => updateField('isActive', !job.isActive)} className={job.isActive ? 'inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700' : 'inline-flex items-center rounded-md bg-gray-600 px-3 py-2 text-white hover:bg-gray-700'}>
            {job.isActive ? 'Active' : 'Inactive'}
          </button>
          <button onClick={remove} className="inline-flex items-center rounded-md border border-red-300 px-3 py-2 text-red-700 hover:bg-red-50">Delete</button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {error && <div className="lg:col-span-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input value={job.title} onChange={e => updateField('title', e.target.value)} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select value={job.department} onChange={e => updateField('department', e.target.value)} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required disabled={loadingData}>
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input value={job.location} onChange={e => updateField('location', e.target.value)} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select value={job.type} onChange={e => updateField('type', e.target.value)} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Experience</label>
              <select value={job.experience} onChange={e => updateField('experience', e.target.value)} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required>
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select value={job.isActive ? 'true' : 'false'} onChange={e => updateField('isActive', e.target.value === 'true')} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={job.description} onChange={e => updateField('description', e.target.value)} rows={6} className="mt-1 w-full rounded-md border border-gray-300 px-3 bg-white" required />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Requirements</label>
              <textarea value={job.requirements.join('\n')} onChange={e => updateField('requirements', e.target.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean))} rows={6} className="mt-1 w-full rounded-md border border-gray-300 px-3 bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Responsibilities</label>
              <textarea value={job.responsibilities.join('\n')} onChange={e => updateField('responsibilities', e.target.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean))} rows={6} className="mt-1 w-full rounded-md border border-gray-300 px-3 bg-white" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Benefits</label>
            <textarea value={(job.benefits || []).join('\n')} onChange={e => updateField('benefits', e.target.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean))} rows={4} className="mt-1 w-full rounded-md border border-gray-300 px-3 bg-white" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Salary Min</label>
              <input type="number" value={job.salary.min} onChange={e => updateField('salary', { ...job.salary, min: Number(e.target.value) })} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Salary Max</label>
              <input type="number" value={job.salary.max} onChange={e => updateField('salary', { ...job.salary, max: Number(e.target.value) })} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <input value={job.salary.currency} onChange={e => updateField('salary', { ...job.salary, currency: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Posted Date</label>
              <input type="date" value={job.postedDate || ''} onChange={e => updateField('postedDate', e.target.value)} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deadline</label>
              <input type="date" value={job.deadline || ''} onChange={e => updateField('deadline', e.target.value)} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <textarea value={(job.tags || []).join(', ')} onChange={e => updateField('tags', e.target.value.split(/,|\r?\n/).map(s => s.trim()).filter(Boolean))} rows={2} className="mt-1 w-full rounded-md border border-gray-300 px-3 bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <input type="email" value={job.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required />
          </div>
        </div>

        <div className="lg:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={submitting} className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={() => router.push('/portal/admin/jobs')} className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100">Cancel</button>
        </div>
      </form>
    </div>
  )
}

