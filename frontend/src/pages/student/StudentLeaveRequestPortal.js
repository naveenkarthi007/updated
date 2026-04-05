import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, ClipboardCheck, Plus, Trash2 } from 'lucide-react';
import { leavesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, EmptyState, Input, MetricPanel, Modal, PanelShell, PortalHero, Spinner, Textarea } from '../../components/ui';

export default function StudentLeaveRequestPortal() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({ from_date: '', to_date: '', reason: '' });

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leavesAPI.getAll({ student_id: user.student_id });
      setLeaves(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load leave history');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [user?.student_id]);

  useEffect(() => {
    if (user?.student_id) {
      fetchLeaves();
    } else if (user) {
      setLoading(false);
    }
  }, [fetchLeaves, user]);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter(item => item.status === 'pending').length,
    approved: leaves.filter(item => item.status === 'approved').length,
  }), [leaves]);

  const handleCreate = async event => {
    event.preventDefault();
    if (!user?.student_id) {
      toast.error('Student profile not linked. Cannot request leave.');
      return;
    }

    try {
      setSubmitLoading(true);
      await leavesAPI.create({ ...formData, student_id: user.student_id });
      toast.success('Leave request submitted');
      setIsModalOpen(false);
      setFormData({ from_date: '', to_date: '', reason: '' });
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this pending request?')) return;
    try {
      await leavesAPI.delete(id);
      toast.success('Request deleted');
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete request');
    }
  };

  const statusVariant = status => ({
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }[status] || 'default');

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Student Outpass"
        title="Leave Requests"
        description="Plan out-of-campus movement, submit leave dates, and keep track of approval status from a single student workflow."
        accent="primary"
        icon={<CalendarClock className="h-4 w-4" />}
        actions={<Button onClick={() => setIsModalOpen(true)} className="h-12 rounded-[18px] px-5"><Plus className="h-4 w-4" /> Apply for Leave</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricPanel title="Total Requests" value={stats.total} helper="Leave entries on file" icon={<ClipboardCheck className="h-5 w-5" />} />
        <MetricPanel title="Pending" value={stats.pending} helper="Waiting for review" tone="orange" icon={<CalendarClock className="h-5 w-5" />} />
        <MetricPanel title="Approved" value={stats.approved} helper="Cleared requests" tone="green" icon={<ClipboardCheck className="h-5 w-5" />} />
      </div>

      <PanelShell title="Leave History" description="Review submitted outpass records and remove a request while it is still pending.">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-primary" /></div>
        ) : leaves.length === 0 ? (
          <EmptyState title="No leave requests yet" description="Your submitted outpass requests will appear here." icon={<CalendarClock className="h-10 w-10" />} />
        ) : (
          <div className="space-y-4">
            {leaves.map(leave => {
              const days = Math.ceil((new Date(leave.to_date) - new Date(leave.from_date)) / (1000 * 60 * 60 * 24)) + 1;
              return (
                <div key={leave.id} className="rounded-[28px] border border-brand-border/70 bg-[#fafbff] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-semibold text-brand-text">{days} day{days > 1 ? 's' : ''} leave</div>
                        <Badge variant={statusVariant(leave.status)}>{leave.status}</Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">From</div>
                          <div className="mt-2 text-sm font-semibold text-brand-text">{new Date(leave.from_date).toLocaleDateString()}</div>
                        </div>
                        <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">To</div>
                          <div className="mt-2 text-sm font-semibold text-brand-text">{new Date(leave.to_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Reason</div>
                        <div className="mt-2 text-sm leading-7 text-brand-text">{leave.reason}</div>
                      </div>
                    </div>

                    {leave.status === 'pending' ? (
                      <Button variant="outline" size="sm" onClick={() => handleDelete(leave.id)} className="h-11 rounded-[18px] px-4 text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PanelShell>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Outpass" size="lg">
        <form onSubmit={handleCreate} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input type="date" label="From Date" required value={formData.from_date} onChange={event => setFormData(current => ({ ...current, from_date: event.target.value }))} className="h-14 rounded-[20px] bg-[#fbfbff] px-5" />
            <Input type="date" label="To Date" required value={formData.to_date} onChange={event => setFormData(current => ({ ...current, to_date: event.target.value }))} className="h-14 rounded-[20px] bg-[#fbfbff] px-5" />
          </div>
          <Textarea
            label="Reason for Leave"
            required
            value={formData.reason}
            onChange={event => setFormData(current => ({ ...current, reason: event.target.value }))}
            placeholder="Share the purpose of your leave request."
            className="min-h-[140px] rounded-[20px] bg-[#fbfbff] px-5 py-4"
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-12 rounded-[18px] px-5">Cancel</Button>
            <Button type="submit" loading={submitLoading} className="h-12 rounded-[18px] px-5">{submitLoading ? 'Submitting...' : 'Submit Request'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
