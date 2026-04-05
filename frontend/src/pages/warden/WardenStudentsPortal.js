import React, { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Search, Users } from 'lucide-react';
import { wardenAPI } from '../../services/api';
import { EmptyState, Input, MetricPanel, PanelShell, PortalHero, Select, Spinner } from '../../components/ui';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSD'];
const PAGE_SIZE = 20;

export default function WardenStudentsPortal() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ dept: '', year: '' });
  const [page, setPage] = useState(1);

  const loadStudents = useCallback(() => {
    setLoading(true);
    wardenAPI.getStudents({ search, ...filters, page, limit: PAGE_SIZE })
      .then(response => {
        setStudents(response.data.data || []);
        setTotal(response.data.total || 0);
      })
      .catch(() => {
        setStudents([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [search, filters, page]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Warden Students"
        title="Student Management"
        description="Search, scan, and review resident student records in a cleaner management workspace."
        accent="blue"
        icon={<GraduationCap className="h-4 w-4" />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <MetricPanel title="Visible Students" value={students.length} helper="Current page results" tone="blue" icon={<Users className="h-5 w-5" />} />
        <MetricPanel title="Total Records" value={total} helper="Students matching current query" tone="primary" icon={<GraduationCap className="h-5 w-5" />} />
      </div>

      <PanelShell title="Filters" description="Refine student records by name, register number, department, and academic year.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={event => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search by name or register no"
            className="h-14 rounded-[20px] bg-[#fbfbff] px-5"
          />
          <Select value={filters.dept} onChange={event => { setFilters(current => ({ ...current, dept: event.target.value })); setPage(1); }} className="h-14 rounded-[20px] bg-[#fbfbff] px-5">
            <option value="">All Departments</option>
            {DEPARTMENTS.map(department => <option key={department} value={department}>{department}</option>)}
          </Select>
          <Select value={filters.year} onChange={event => { setFilters(current => ({ ...current, year: event.target.value })); setPage(1); }} className="h-14 rounded-[20px] bg-[#fbfbff] px-5">
            <option value="">All Years</option>
            {[1, 2, 3, 4].map(year => <option key={year} value={year}>Year {year}</option>)}
          </Select>
        </div>
      </PanelShell>

      <PanelShell title="Student Directory" description="Resident student records with academic and room details.">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-sky-500" /></div>
        ) : students.length === 0 ? (
          <EmptyState title="No students found" description="Try changing the search term or filters to find more records." icon={<Users className="h-10 w-10" />} />
        ) : (
          <div className="space-y-4">
            {students.map(student => (
              <div key={student.id} className="rounded-[28px] border border-brand-border/70 bg-[#fafbff] p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-sm font-bold text-white">
                      {student.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-brand-text">{student.name}</div>
                      <div className="mt-1 text-sm text-brand-muted">{student.email || 'No email available'}</div>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 xl:w-[760px]">
                    <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Register No</div>
                      <div className="mt-2 text-sm font-semibold text-brand-text">{student.register_no}</div>
                    </div>
                    <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Department</div>
                      <div className="mt-2 text-sm font-semibold text-brand-text">{student.department}</div>
                    </div>
                    <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Year</div>
                      <div className="mt-2 text-sm font-semibold text-brand-text">Year {student.year}</div>
                    </div>
                    <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Room</div>
                      <div className="mt-2 text-sm font-semibold text-brand-text">{student.room_number ? `${student.room_number} (Block ${student.block})` : 'Not allocated'}</div>
                    </div>
                    <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Phone</div>
                      <div className="mt-2 text-sm font-semibold text-brand-text">{student.phone || 'Unavailable'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > PAGE_SIZE ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-brand-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-brand-muted">Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)} className="rounded-2xl border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted disabled:opacity-50">Previous</button>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(current => current + 1)} className="rounded-2xl border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted disabled:opacity-50">Next</button>
            </div>
          </div>
        ) : null}
      </PanelShell>
    </div>
  );
}
