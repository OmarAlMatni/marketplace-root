import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Shield, Ban, CheckCircle, XCircle, AlertTriangle, MessageSquare, AlertOctagon, MoreVertical, X } from 'lucide-react';

export default function ReportsView() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionType, setActionType] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    loadReports();
  }, [filter]);

  async function loadReports() {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/api/admin/reports', { params: { status: filter } });
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  function openActionModal(report, action) {
    setSelectedReport(report);
    setActionType(action);
    setCustomMessage('');
    setShowActionModal(true);
    setOpenMenuId(null);
  }

  async function confirmAction() {
    if (!selectedReport) return;

    try {
      await axiosClient.post(`/api/admin/reports/${selectedReport.id}/action`, { 
        action: actionType, 
        customMessage: (actionType === 'warning' || actionType === 'message') ? customMessage : null 
      });
      setShowActionModal(false);
      setSelectedReport(null);
      loadReports();
    } catch (err) {
      console.error('Failed to perform action:', err);
      alert('Action failed. Please try again.');
    }
  }

  async function handleAction(reportId, action, reportedUserId) {
    if (action === 'ban' && !window.confirm('Ban this user? They will no longer be able to access the platform.')) {
      return;
    }

    if (action === 'warning' || action === 'message') {
      const report = reports.find(r => r.id === reportId);
      openActionModal(report, action);
    } else {
      // For actions without custom message (ban, resolve, dismiss)
      try {
        await axiosClient.post(`/api/admin/reports/${reportId}/action`, { action, customMessage: null });
        loadReports();
      } catch (err) {
        console.error('Failed to perform action:', err);
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reported Content</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review and moderate reports</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {['pending', 'resolved', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                filter === status
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No {filter} reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Reporter</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{report.reporter?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 truncate">{report.reporter?.email}</p>
                  </div>
                  
                  <div className="text-slate-300 dark:text-slate-600">→</div>
                  
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-red-400 mb-0.5">Reported User</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{report.reported_user?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 truncate">{report.reported_user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <span className="text-[10px] text-slate-400">{new Date(report.created_at).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    report.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {report.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 mb-3 border-l-2 border-indigo-500">
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{report.reason}"</p>
              </div>

              {report.status === 'pending' && (
                <div className="relative flex justify-end">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === report.id ? null : report.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-3 h-3" /> Take Action
                  </button>

                  {openMenuId === report.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-10">
                      <button onClick={() => handleAction(report.id, 'warning', report.reported_user?.id)} className="w-full px-3 py-2 text-left text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2">
                        <AlertOctagon className="w-3 h-3" /> Send Warning
                      </button>
                      <button onClick={() => handleAction(report.id, 'message', report.reported_user?.id)} className="w-full px-3 py-2 text-left text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> Message User
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                      <button onClick={() => handleAction(report.id, 'ban', report.reported_user?.id)} className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                        <Ban className="w-3 h-3" /> Ban User
                      </button>
                      <button onClick={() => handleAction(report.id, 'resolve')} className="w-full px-3 py-2 text-left text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3" /> Mark Resolved
                      </button>
                      <button onClick={() => handleAction(report.id, 'dismiss')} className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                        <XCircle className="w-3 h-3" /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  actionType === 'warning' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-blue-100 dark:bg-blue-900/20'
                }`}>
                  {actionType === 'warning' ? (
                    <AlertOctagon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {actionType === 'warning' ? 'Send Warning' : 'Send Message'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    To: {selectedReport?.reported_user?.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowActionModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {actionType === 'warning' ? 'Warning Message:' : 'Your Message:'}
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={actionType === 'warning' 
                  ? 'Explain why this is a warning...' 
                  : 'Type your message to the user...'
                }
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                This message will be sent as a notification to the user.
              </p>
            </div>
            
            <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={!customMessage.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                {actionType === 'warning' ? 'Send Warning' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}