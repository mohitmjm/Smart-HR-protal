import { getCareersJobModel } from '@/models/careers/Job'
import { getCareersApplicationModel } from '@/models/careers/Application'
import Link from 'next/link'
import OrgStructure from '@/models/OrgStructure'
import connectDB from '@/lib/mongodb'
import JobsTabsWrapper from './JobsTabsWrapper'
import ApplicationsTab from './ApplicationsTab'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type JobListItem = {
  _id: string
  title: string
  department: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience: 'entry' | 'mid' | 'senior' | 'lead'
  isActive: boolean
  postedDate?: string
}

function toStr(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export const dynamic = 'force-dynamic'

export default async function AdminJobsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const page = Math.max(parseInt(toStr(sp.page) || '1', 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(toStr(sp.pageSize) || '20', 10) || 20, 1), 100)
  const q = toStr(sp.q)?.trim()
  const department = toStr(sp.department)
  const type = toStr(sp.type) as JobListItem['type'] | undefined
  const location = toStr(sp.location)
  const isActiveStr = toStr(sp.isActive)
  const isActive = isActiveStr === 'true' ? true : isActiveStr === 'false' ? false : undefined

  const Job = await getCareersJobModel()

  const query: Record<string, unknown> = {}
  if (q) query.$text = { $search: q }
  if (department) query.department = department
  if (location) query.location = location
  if (type && ['full-time', 'part-time', 'contract', 'internship'].includes(type)) query.type = type
  if (typeof isActive === 'boolean') query.isActive = isActive

  // Fetch departments from org structure
  let departmentOptions: string[] = []
  try {
    await connectDB()
    const orgStructure = await OrgStructure.findOne({})
    if (orgStructure && orgStructure.departments) {
      departmentOptions = orgStructure.departments
        .filter((dept: any) => dept.isActive)
        .map((dept: any) => dept.name)
        .sort((a: string, b: string) => a.localeCompare(b))
    }
  } catch (err) {
    console.error('Failed to fetch departments from org structure:', err)
    // Fallback to distinct from jobs if org structure fetch fails
    departmentOptions = (await Job.distinct('department', {})) as string[]
    departmentOptions.sort((a, b) => a.localeCompare(b))
  }

  const [items, total, locations] = await Promise.all([
    Job.find(query)
      .select('title department location type experience isActive postedDate')
      .sort({ postedDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Job.countDocuments(query),
    Job.distinct('location', {}),
  ])

  const jobs: JobListItem[] = (items as any[]).map(d => ({
    _id: String(d._id),
    title: d.title,
    department: d.department,
    location: d.location,
    type: d.type,
    experience: d.experience,
    isActive: !!d.isActive,
    postedDate: d.postedDate ? String(d.postedDate) : undefined,
  }))

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const depOptions = departmentOptions
  const locOptions = (locations as string[]).sort((a, b) => a.localeCompare(b))

  // Fetch applications count for badge
  let applicationsCount = 0
  let initialApplications: any[] = []
  let initialApplicationsTotal = 0
  try {
    const Application = await getCareersApplicationModel()
    applicationsCount = await Application.countDocuments({ isActive: true })
    
    // Fetch first page of applications for initial render
    const appPage = 1
    const appPageSize = 20
    const [apps, appTotal] = await Promise.all([
      Application.find({ isActive: true })
        .populate('jobId', 'title department')
        .sort({ appliedDate: -1 })
        .skip((appPage - 1) * appPageSize)
        .limit(appPageSize)
        .select('-__v')
        .lean(),
      Application.countDocuments({ isActive: true }),
    ])
    // Serialize MongoDB documents to plain objects for Client Component
    initialApplications = (apps as any[]).map(app => ({
      _id: String(app._id),
      jobId: app.jobId ? {
        _id: String((app.jobId as any)._id || app.jobId),
        title: (app.jobId as any).title || 'N/A',
        department: (app.jobId as any).department || '',
      } : null,
      firstName: app.firstName,
      lastName: app.lastName,
      preferredName: app.preferredName,
      email: app.email,
      phone: app.phone,
      location: app.location,
      education: (app.education || []).map((edu: any) => ({
        institute: edu.institute || '',
        degree: edu.degree || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
      })),
      experience: (app.experience || []).map((exp: any) => ({
        company: exp.company || '',
        position: exp.position || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        duties: exp.duties || '',
      })),
      resumeUrl: app.resumeUrl,
      status: app.status,
      appliedDate: app.appliedDate ? new Date(app.appliedDate).toISOString() : new Date().toISOString(),
      isActive: app.isActive,
    }))
    initialApplicationsTotal = appTotal
  } catch (err) {
    console.error('Failed to fetch applications:', err)
  }

  // New job button
  const newJobButton = (
    <Link href="/portal/admin/jobs/new" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
      New job
    </Link>
  )

  // Jobs tab content
  const jobsContent = (
    <>
      <form className="mb-6 space-y-3" action="/portal/admin/jobs" method="get">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <label htmlFor="q" className="block text-sm font-medium text-gray-700">Search</label>
            <input id="q" name="q" defaultValue={q} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white focus:border-blue-500 focus:ring-blue-500" placeholder="Title or description" />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
            <select id="department" name="department" defaultValue={department || ''} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white focus:border-blue-500 focus:ring-blue-500">
              <option value="">All</option>
              {depOptions.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
            <select id="type" name="type" defaultValue={type || ''} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white focus:border-blue-500 focus:ring-blue-500">
              <option value="">Any</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
            <select id="location" name="location" defaultValue={location || ''} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white focus:border-blue-500 focus:ring-blue-500">
              <option value="">All</option>
              {locOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">Status</label>
            <select id="isActive" name="isActive" defaultValue={isActiveStr || ''} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white focus:border-blue-500 focus:ring-blue-500">
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Apply</button>
          <Link href="/portal/admin/jobs" className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100">Clear</Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><input type="checkbox" aria-label="Select all" disabled /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {jobs.map(job => (
              <tr key={job._id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${job.title}`} disabled /></td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{job.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{job.department}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{job.location}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{job.type.replace('-', ' ')}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{job.experience}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{job.postedDate ? new Date(job.postedDate).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3">
                  <span className={job.isActive ? 'inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20' : 'inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/10'}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/portal/admin/jobs/${job._id}`} className="text-blue-600 hover:text-blue-800 text-sm">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Total: {total}</div>
        <div className="flex items-center gap-2">
          <a className={`px-3 py-1 rounded-md border ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`} href={`/portal/admin/jobs?page=${page - 1}&pageSize=${pageSize}`}>Prev</a>
          <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
          <a className={`px-3 py-1 rounded-md border ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`} href={`/portal/admin/jobs?page=${page + 1}&pageSize=${pageSize}`}>Next</a>
        </div>
      </div>
    </>
  )

  // Applications tab content
  const applicationsContent = (
    <ApplicationsTab
      applications={initialApplications}
      total={initialApplicationsTotal}
      page={1}
      pageSize={20}
    />
  )

  return (
    <JobsTabsWrapper
      jobsContent={jobsContent}
      applicationsContent={applicationsContent}
      applicationsCount={applicationsCount}
      newJobButton={newJobButton}
    />
  )
}

