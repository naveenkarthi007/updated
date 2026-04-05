import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowRight,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Eye,
  PencilLine,
  SearchCheck,
  Sparkles,
  UserCog,
} from 'lucide-react';
import { studentPortalAPI } from '../../services/api';
import { Badge, Button, EmptyState, Input, Modal, Select, Spinner, Textarea } from '../../components/ui';

const CATEGORY_OPTIONS = ['all', 'plumbing', 'electrical', 'carpentry', 'housekeeping', 'network', 'mess', 'other'];
const PRIORITY_OPTIONS = ['all', 'low', 'medium', 'high'];
const STATUS_OPTIONS = ['all', 'pending', 'in_progress', 'resolved'];

const CATEGORY_META = {
  plumbing: { label: 'Plumbing', desk: 'Maintenance Desk', accent: 'bg-sky-50 text-sky-700 border-sky-100' },
  electrical: { label: 'Electrical', desk: 'Electrical Team', accent: 'bg-violet-50 text-violet-700 border-violet-100' },
  carpentry: { label: 'Carpentry', desk: 'Facility Repairs', accent: 'bg-amber-50 text-amber-700 border-amber-100' },
  housekeeping: { label: 'Housekeeping', desk: 'Housekeeping Crew', accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  network: { label: 'Network', desk: 'IT Support Cell', accent: 'bg-blue-50 text-blue-700 border-blue-100' },
  mess: { label: 'Mess', desk: 'Mess Operations', accent: 'bg-rose-50 text-rose-700 border-rose-100' },
  other: { label: 'General', desk: 'Student Services Desk', accent: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const STATUS_META = {
  pending: { label: 'Pending', badge: 'warning', pill: 'bg-amber-50 text-amber-700 border-amber-100', helper: 'Queued for hostel review' },
  in_progress: { label: 'In Progress', badge: 'info', pill: 'bg-blue-50 text-blue-700 border-blue-100', helper: 'Assigned to a service desk' },
  resolved: { label: 'Resolved', badge: 'success', pill: 'bg-emerald-50 text-emerald-700 border-emerald-100', helper: 'Closed and confirmed' },
};

const PRIORITY_META = {
  low: { label: 'Low', badge: 'success', pill: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  medium: { label: 'Medium', badge: 'warning', pill: 'bg-amber-50 text-amber-700 border-amber-100' },
  high: { label: 'High', badge: 'danger', pill: 'bg-red-50 text-red-700 border-red-100' },
};

const DEFAULT_FORM = { title: '', description: '', category: 'other', priority: 'medium' };

function toTitleCase(value) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', category: 'all', priority: 'all' });
  const [form, setForm] = useState(DEFAULT_FORM);

  const loadComplaints = () => {
    setLoading(true);
    studentPortalAPI.getComplaints()
      .then(response => setComplaints(response.data.data || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const filteredComplaints = useMemo(() => complaints.filter(complaint => (
    (filters.status === 'all' || complaint.status === filters.status) &&
    (filters.category === 'all' || complaint.category === filters.category) &&
    (filters.priority === 'all' || complaint.priority === filters.priority)
  )), [complaints, filters]);

  const complaintStats = useMemo(() => ({
    pending: complaints.filter(complaint => complaint.status === 'pending').length,
    inProgress: complaints.filter(complaint => complaint.status === 'in_progress').length,
    resolved: complaints.filter(complaint => complaint.status === 'resolved').length,
    active: complaints.filter(complaint => complaint.status !== 'resolved').length,
  }), [complaints]);

  const resetFormState = () => {
    setForm(DEFAULT_FORM);
    setEditingComplaint(null);
    setModalOpen(false);
  };

  const openCreateModal = () => {
    setEditingComplaint(null);
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  };

  const openEditModal = complaint => {
    if (complaint.status !== 'pending') {
      toast.error('Only pending complaints can be edited.');
      return;
    }

    setEditingComplaint(complaint);
    setForm({
      title: complaint.title || '',
      description: complaint.description || '',
      category: complaint.category || 'other',
      priority: complaint.priority || 'medium',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }

    setSaving(true);
    try {
      if (editingComplaint) {
        await studentPortalAPI.updateComplaint(editingComplaint.id, form);
        toast.success('Complaint updated successfully.');
      } else {
        await studentPortalAPI.fileComplaint(form);
        toast.success('Complaint filed successfully.');
      }

      resetFormState();
      loadComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save complaint.');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async complaint => {
    if (complaint.status === 'resolved') return;

    try {
      await studentPortalAPI.resolveComplaint(complaint.id);
      toast.success('Complaint marked as resolved.');
      if (selectedComplaint?.id === complaint.id) {
        setSelectedComplaint(current => current ? { ...current, status: 'resolved' } : current);
      }
      loadComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to resolve complaint.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/80 px-6 py-7 shadow-[0_28px_60px_rgba(145,158,171,0.14)] backdrop-blur-xl md:px-8 md:py-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(159,116,247,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(3,136,252,0.08),transparent_24%)]" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#dbe7ff] blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f4f1ff] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              Student Services Desk
            </div>
            <h1 className="mt-6 max-w-2xl font-display text-4xl font-black tracking-[-0.04em] text-brand-text md:text-[3.55rem] md:leading-[1.04]">
              Complaints and Service Requests
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-brand-muted md:text-[1.15rem]">
              Track maintenance issues, grievance requests, room concerns, and service-desk responses from one premium resident portal.
            </p>
            <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-[#ece8ff] bg-[#f8f6ff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5d5f90]">
              <SearchCheck className="h-4 w-4 text-brand-primary" strokeWidth={2} />
              {complaintStats.active} Active Records
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 xl:max-w-sm xl:items-end">
            <Button
              onClick={openCreateModal}
              className="h-14 rounded-[20px] px-6 text-base shadow-[0_18px_42px_rgba(125,83,246,0.24)]"
            >
              File Complaint
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Button>

            <div className="w-full rounded-[28px] border border-[#ece8ff] bg-[linear-gradient(180deg,rgba(250,248,255,0.95)_0%,rgba(244,247,255,0.92)_100%)] p-5 shadow-sm xl:max-w-[310px]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">Service Summary</div>
                  <div className="mt-2 text-2xl font-black text-brand-text">{filteredComplaints.length}</div>
                  <div className="mt-1 text-sm text-brand-muted">Visible requests after filters</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                  <ClipboardList className="h-5 w-5" strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Pending', value: complaintStats.pending, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'In Progress', value: complaintStats.inProgress, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Resolved', value: complaintStats.resolved, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-[32px] border border-white/80 bg-white/85 px-6 py-7 text-center shadow-[0_20px_48px_rgba(145,158,171,0.12)] backdrop-blur-xl"
          >
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7f8fd] text-brand-primary">
              <CircleAlert className="h-5 w-5" strokeWidth={1.9} />
            </div>
            <div className="font-display text-4xl font-black tracking-[-0.04em] text-brand-text">{item.value}</div>
            <div className="mt-2 text-[13px] font-semibold uppercase tracking-[0.2em] text-brand-muted">{item.label}</div>
            <div className={`mx-auto mt-5 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${item.tone}`}>
              Updated live
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[36px] border border-white/80 bg-white/85 shadow-[0_24px_60px_rgba(145,158,171,0.14)] backdrop-blur-xl">
        <div className="bg-[linear-gradient(180deg,rgba(247,248,253,0.95)_0%,rgba(247,248,253,0.75)_100%)] px-6 py-6 md:px-8 md:py-7">
          <h2 className="font-display text-[2rem] font-bold tracking-[-0.04em] text-brand-text">Service Filters</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-muted md:text-base">
            Narrow requests by workflow status, complaint category, and urgency to review the exact service tickets you need.
          </p>
        </div>

        <div className="border-t border-brand-border/70 px-6 py-6 md:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              value={filters.status}
              onChange={event => setFilters(current => ({ ...current, status: event.target.value }))}
              className="h-14 rounded-[20px] border-brand-border/80 bg-[#fbfbff] px-5 text-base"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All Status' : toTitleCase(option)}
                </option>
              ))}
            </Select>

            <Select
              value={filters.category}
              onChange={event => setFilters(current => ({ ...current, category: event.target.value }))}
              className="h-14 rounded-[20px] border-brand-border/80 bg-[#fbfbff] px-5 text-base"
            >
              {CATEGORY_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All Categories' : CATEGORY_META[option]?.label || toTitleCase(option)}
                </option>
              ))}
            </Select>

            <Select
              value={filters.priority}
              onChange={event => setFilters(current => ({ ...current, priority: event.target.value }))}
              className="h-14 rounded-[20px] border-brand-border/80 bg-[#fbfbff] px-5 text-base"
            >
              {PRIORITY_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All Priority' : toTitleCase(option)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/80 bg-[linear-gradient(180deg,rgba(247,248,253,0.72)_0%,rgba(255,255,255,0.84)_100%)] p-4 shadow-[0_24px_60px_rgba(145,158,171,0.12)] backdrop-blur-xl md:p-5">
        <div className="mb-4 flex flex-col gap-3 px-2 pt-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">Resident Queue</div>
            <h2 className="mt-2 font-display text-[1.9rem] font-bold tracking-[-0.04em] text-brand-text">Open Requests</h2>
          </div>
          <div className="rounded-full border border-brand-border/70 bg-white/90 px-4 py-2 text-sm font-medium text-brand-muted">
            {filteredComplaints.length} request{filteredComplaints.length === 1 ? '' : 's'} found
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-brand-primary" />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="rounded-[28px] bg-white/80 px-4 py-10">
            <EmptyState
              title="No complaints match the selected filters"
              description="Try adjusting the workflow, category, or priority filters to see more service records."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint, index) => {
              const categoryMeta = CATEGORY_META[complaint.category] || CATEGORY_META.other;
              const statusMeta = STATUS_META[complaint.status] || STATUS_META.pending;
              const priorityMeta = PRIORITY_META[complaint.priority] || PRIORITY_META.medium;
              const canEdit = complaint.status === 'pending';
              const canResolve = complaint.status !== 'resolved';

              return (
                <motion.article
                  key={complaint.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="group rounded-[30px] border border-white/90 bg-white/88 p-5 shadow-[0_22px_54px_rgba(145,158,171,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_70px_rgba(145,158,171,0.16)] md:p-6"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
                        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] border ${categoryMeta.accent}`}>
                          <ClipboardList className="h-5 w-5" strokeWidth={1.9} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="font-display text-[1.45rem] font-bold tracking-[-0.03em] text-brand-text">
                              {complaint.title}
                            </h3>
                            <Badge variant={statusMeta.badge}>{statusMeta.label}</Badge>
                            <Badge variant={priorityMeta.badge}>{priorityMeta.label} Priority</Badge>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                            <span className={`inline-flex rounded-full border px-3 py-1 ${categoryMeta.accent}`}>
                              {categoryMeta.label}
                            </span>
                            <span className={`inline-flex rounded-full border px-3 py-1 ${statusMeta.pill}`}>
                              {statusMeta.helper}
                            </span>
                          </div>

                          <p className="mt-4 max-w-4xl text-sm leading-7 text-brand-muted md:text-[15px]">
                            {complaint.description || 'No additional description provided for this service request.'}
                          </p>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-[22px] border border-brand-border/60 bg-[#fafbff] px-4 py-3">
                              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
                                <CalendarDays className="h-3.5 w-3.5 text-brand-primary" strokeWidth={2} />
                                Created
                              </div>
                              <div className="mt-2 text-sm font-semibold text-brand-text">
                                {format(new Date(complaint.created_at), 'dd MMM yyyy')}
                              </div>
                            </div>

                            <div className="rounded-[22px] border border-brand-border/60 bg-[#fafbff] px-4 py-3">
                              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
                                <UserCog className="h-3.5 w-3.5 text-brand-primary" strokeWidth={2} />
                                Assigned Desk
                              </div>
                              <div className="mt-2 text-sm font-semibold text-brand-text">{categoryMeta.desk}</div>
                            </div>

                            <div className="rounded-[22px] border border-brand-border/60 bg-[#fafbff] px-4 py-3">
                              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
                                <ChevronRight className="h-3.5 w-3.5 text-brand-primary" strokeWidth={2} />
                                Room
                              </div>
                              <div className="mt-2 text-sm font-semibold text-brand-text">
                                {complaint.room_number ? `Room ${complaint.room_number}` : 'Resident record'}
                              </div>
                            </div>

                            <div className="rounded-[22px] border border-brand-border/60 bg-[#fafbff] px-4 py-3">
                              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
                                <CheckCheck className="h-3.5 w-3.5 text-brand-primary" strokeWidth={2} />
                                Updated
                              </div>
                              <div className="mt-2 text-sm font-semibold text-brand-text">
                                {format(new Date(complaint.updated_at || complaint.created_at), 'dd MMM yyyy')}
                              </div>
                            </div>
                          </div>

                          {complaint.admin_note ? (
                            <div className="mt-5 rounded-[22px] border border-[#ece8ff] bg-[#f8f6ff] px-4 py-4">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">Admin Note</div>
                              <p className="mt-2 text-sm leading-7 text-brand-muted">{complaint.admin_note}</p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:w-[240px] xl:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedComplaint(complaint)}
                        className="h-11 rounded-[18px] px-4"
                      >
                        <Eye className="h-4 w-4" strokeWidth={1.9} />
                        View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canEdit}
                        onClick={() => openEditModal(complaint)}
                        className="h-11 rounded-[18px] px-4 disabled:opacity-45"
                      >
                        <PencilLine className="h-4 w-4" strokeWidth={1.9} />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        disabled={!canResolve}
                        onClick={() => handleResolve(complaint)}
                        className="h-11 rounded-[18px] px-4 disabled:opacity-45"
                      >
                        <CheckCheck className="h-4 w-4" strokeWidth={1.9} />
                        {canResolve ? 'Resolve' : 'Resolved'}
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        open={modalOpen}
        onClose={resetFormState}
        title={editingComplaint ? 'Edit Complaint' : 'File New Complaint'}
        size="lg"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Complaint Title"
              value={form.title}
              onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
              placeholder="Briefly describe the issue"
              className="h-16 rounded-[24px] bg-[#fbfbff] px-6 text-base"
            />
          </div>

          <div>
            <Select
              label="Category"
              value={form.category}
              onChange={event => setForm(current => ({ ...current, category: event.target.value }))}
              className="h-16 rounded-[24px] bg-[#fbfbff] px-6 text-base"
            >
              {CATEGORY_OPTIONS.filter(option => option !== 'all').map(option => (
                <option key={option} value={option}>
                  {CATEGORY_META[option]?.label || toTitleCase(option)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Priority"
              value={form.priority}
              onChange={event => setForm(current => ({ ...current, priority: event.target.value }))}
              className="h-16 rounded-[24px] bg-[#fbfbff] px-6 text-base"
            >
              {PRIORITY_OPTIONS.filter(option => option !== 'all').map(option => (
                <option key={option} value={option}>
                  {toTitleCase(option)}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
              placeholder="Add room details, issue severity, or any other context for the hostel team."
              className="min-h-[150px] rounded-[24px] bg-[#fbfbff] px-6 py-5 text-base"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-1 md:col-span-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={resetFormState}
              className="h-14 rounded-[20px] px-6 text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={saving}
              className="h-14 rounded-[20px] px-6 text-base"
            >
              {editingComplaint ? 'Save Changes' : 'File Complaint'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        title="Complaint Details"
        size="lg"
      >
        {selectedComplaint ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={(STATUS_META[selectedComplaint.status] || STATUS_META.pending).badge}>
                {(STATUS_META[selectedComplaint.status] || STATUS_META.pending).label}
              </Badge>
              <Badge variant={(PRIORITY_META[selectedComplaint.priority] || PRIORITY_META.medium).badge}>
                {(PRIORITY_META[selectedComplaint.priority] || PRIORITY_META.medium).label} Priority
              </Badge>
              <Badge variant="default">
                {(CATEGORY_META[selectedComplaint.category] || CATEGORY_META.other).label}
              </Badge>
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-brand-text">{selectedComplaint.title}</h3>
              <p className="mt-3 text-sm leading-7 text-brand-muted">
                {selectedComplaint.description || 'No additional description was attached to this complaint.'}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[22px] border border-brand-border/70 bg-[#fafbff] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Created On</div>
                <div className="mt-2 text-sm font-semibold text-brand-text">
                  {format(new Date(selectedComplaint.created_at), 'dd MMM yyyy, hh:mm a')}
                </div>
              </div>

              <div className="rounded-[22px] border border-brand-border/70 bg-[#fafbff] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Assigned Desk</div>
                <div className="mt-2 text-sm font-semibold text-brand-text">
                  {(CATEGORY_META[selectedComplaint.category] || CATEGORY_META.other).desk}
                </div>
              </div>
            </div>

            {selectedComplaint.admin_note ? (
              <div className="rounded-[24px] border border-[#ece8ff] bg-[#f8f6ff] px-5 py-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">Admin Note</div>
                <p className="mt-2 text-sm leading-7 text-brand-muted">{selectedComplaint.admin_note}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
