"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Trash2, 
  Archive, 
  RefreshCw, 
  Download, 
  Printer, 
  Upload,
  Inbox,
  MailOpen,
  MailCheck,
  MailX,
  MailWarning,
  FileText,
  User,
  Star,
  Folder
} from "lucide-react";
import PageHeader from "@/components/PageHeader/PageHeader";
import SummaryCard from '@/components/SummaryCard';
import { EmptyState } from '@/components/reusable';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import ImportDialog from '@/components/reusable/Dialogs/ImportDialog';
import { EmailDetailDialog, EmailComposeDialog, EmailBulkMoveDialog } from '@/components/reusable/Dialogs';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { TablePagination } from '@/components/reusable/Table/TablePagination';
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface Email {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'DRAFT' | 'PENDING';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  type: 'INBOX' | 'SENT' | 'DRAFT' | 'SPAM' | 'TRASH';
  content: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  recipients?: Array<{ address: string; rtype: 'TO' | 'CC' | 'BCC' }>;
  attachments?: Array<{ name: string; url: string }>;
}

const mockEmails: Email[] = [];

export default function EmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [serverStats, setServerStats] = useState<{ byFolder: { inbox: number; sent: number; draft: number; spam: number; trash: number }; unread: number; failed: number } | null>(null);

  // Selection metadata for conditional bulk actions
  const selectedMeta = useMemo(() => {
    const selectedSet = new Set(selectedItems);
    let anyStarred = false;
    let anyUnstarred = false;
    let anyUnread = false;
    let anyRead = false;
    for (const e of emails) {
      if (!selectedSet.has(e.id)) continue;
      if (e.isStarred) anyStarred = true; else anyUnstarred = true;
      if (e.isRead) anyRead = true; else anyUnread = true;
      if (anyStarred && anyUnstarred && anyRead && anyUnread) break;
    }
    return { anyStarred, anyUnstarred, anyRead, anyUnread };
  }, [emails, selectedItems]);
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [activeEmail, setActiveEmail] = useState<Email | null>(null);
  const [detailDownloading, setDetailDownloading] = useState<boolean>(false);
  const [composeOpen, setComposeOpen] = useState<boolean>(false);
  const [composeSending, setComposeSending] = useState<boolean>(false);
  const [importOpen, setImportOpen] = useState<boolean>(false);
  const [composeData, setComposeData] = useState({
    subject: "",
    sender: "admin@icct.edu",
    recipient: "",
    cc: "",
    bcc: "",
    content: "",
    priority: "NORMAL" as const,
  });
  const [bulkMoveOpen, setBulkMoveOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const debouncedSearch = useDebounce(searchValue, 400);

  // Simple list virtualization
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [listViewportH, setListViewportH] = useState<number>(0);
  const [listScrollTop, setListScrollTop] = useState<number>(0);
  const estimatedRowHeight = 140; // px, rough estimate per email row (increased for new design)

  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    const handleResize = () => setListViewportH(el.clientHeight || 0);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // CSRF token helper (reads cookie or fetches a new token)
  const getCsrfToken = useCallback(async (): Promise<string | null> => {
    try {
      const cookie = typeof document !== 'undefined' ? document.cookie : '';
      const match = cookie.match(/(?:^|; )csrf-token=([^;]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
      // fetch a new token which will set the cookie
      const res = await fetch('/api/csrf-token', { method: 'GET', cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.token || null;
    } catch {
      return null;
    }
  }, []);


  // Selection helpers
  const allIdsOnPage = useMemo(() => emails.map(e => e.id), [emails]);
  const allSelectedOnPage = useMemo(
    () => allIdsOnPage.length > 0 && allIdsOnPage.every(id => selectedItems.includes(id)),
    [allIdsOnPage, selectedItems]
  );
  const someSelectedOnPage = useMemo(
    () => allIdsOnPage.some(id => selectedItems.includes(id)) && !allSelectedOnPage,
    [allIdsOnPage, selectedItems, allSelectedOnPage]
  );
  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedItems(prev => {
      if (allSelectedOnPage) {
        // Deselect only items from this page
        const setIds = new Set(allIdsOnPage);
        return prev.filter(id => !setIds.has(id));
      }
      // Add all items from this page
      const setPrev = new Set(prev);
      allIdsOnPage.forEach(id => setPrev.add(id));
      return Array.from(setPrev);
    });
  }, [allSelectedOnPage, allIdsOnPage]);

  // Auto-clear selection when changing pagination or filters/sorts
  useEffect(() => {
    setSelectedItems([]);
  }, [page, pageSize, searchValue, statusFilter, priorityFilter, folderFilter, sortBy, sortOrder]);

  const mapStatus = (val: string) => {
    const m: Record<string, string> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
      draft: 'DRAFT',
      pending: 'PENDING',
    };
    return m[val] || val.toUpperCase();
  };

  const mapPriority = (val: string) => {
    const m: Record<string, string> = {
      urgent: 'URGENT',
      high: 'HIGH',
      normal: 'NORMAL',
      low: 'LOW',
    };
    return m[val] || val.toUpperCase();
  };

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', mapStatus(statusFilter) as string);
      if (priorityFilter !== 'all') params.set('priority', mapPriority(priorityFilter) as string);
      if (folderFilter !== 'all') params.set('folder', folderFilter.toUpperCase());
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      const res = await fetch(`/api/emails?${params.toString()}`, { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) {
        toast.error('Your session expired. Please login again.');
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'Failed to load emails');
      }
      const data = await res.json();
      const items = (data.items || []).map((e: any) => ({
        id: e.id,
        subject: e.subject,
        sender: e.sender,
        recipient: e.recipient,
        timestamp: e.timestamp,
        status: String(e.status || '').toUpperCase() as Email['status'],
        priority: String(e.priority || '').toUpperCase() as Email['priority'],
        type: String(e.type || '').toUpperCase() as Email['type'],
        content: e.content,
        isRead: Boolean(e.isRead),
        isStarred: Boolean(e.isStarred),
        isImportant: Boolean(e.isImportant),
      })) as Email[];
      setEmails(items);
      setTotal(data.total || 0);
      if (data.stats) {
        setServerStats(data.stats);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, folderFilter, page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, folderFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Initialize state from URL on first load
  useEffect(() => {
    if (!searchParams) return;
    const q = searchParams.get('q');
    const st = searchParams.get('st');
    const pr = searchParams.get('pr');
    const fo = searchParams.get('fo');
    const sb = searchParams.get('sb');
    const so = searchParams.get('so');
    const pg = searchParams.get('pg');
    const ps = searchParams.get('ps');
    if (q !== null) setSearchValue(q);
    if (st) setStatusFilter(st.toLowerCase());
    if (pr) setPriorityFilter(pr.toLowerCase());
    if (fo) setFolderFilter(fo.toLowerCase());
    if (sb) setSortBy(sb);
    if (so === 'asc' || so === 'desc') setSortOrder(so);
    if (pg) setPage(Math.max(1, parseInt(pg, 10) || 1));
    if (ps) setPageSize(Math.min(100, Math.max(1, parseInt(ps, 10) || 20)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push state to URL on changes (shallow)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (searchValue) sp.set('q', searchValue);
    if (statusFilter !== 'all') sp.set('st', statusFilter);
    if (priorityFilter !== 'all') sp.set('pr', priorityFilter);
    if (folderFilter !== 'all') sp.set('fo', folderFilter);
    if (sortBy !== 'timestamp') sp.set('sb', sortBy);
    if (sortOrder !== 'desc') sp.set('so', sortOrder);
    if (page !== 1) sp.set('pg', String(page));
    if (pageSize !== 20) sp.set('ps', String(pageSize));
    const qs = sp.toString();
    const url = qs ? `?${qs}` : '';
    // Avoid full reload
    window.history.replaceState(null, '', url);
  }, [searchValue, statusFilter, priorityFilter, folderFilter, sortBy, sortOrder, page, pageSize]);

  const toClientEmail = (e: any): Email => ({
    id: e.id,
    subject: e.subject,
    sender: e.sender,
    recipient: e.recipient,
    timestamp: e.timestamp,
    status: String(e.status || '').toUpperCase() as Email['status'],
    priority: String(e.priority || '').toUpperCase() as Email['priority'],
    type: String(e.type || '').toUpperCase() as Email['type'],
    content: e.content,
    isRead: Boolean(e.isRead),
    isStarred: Boolean(e.isStarred),
    isImportant: Boolean(e.isImportant),
    recipients: Array.isArray(e.recipients) ? e.recipients : undefined,
    attachments: Array.isArray(e.attachments) ? e.attachments : undefined,
  });

  // Download helpers for attachments
  const downloadBlob = useCallback(async (url: string, filename: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to download');
    const blob = await res.blob();
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = filename || 'file';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }, []);

  const handleDownloadAllAttachments = useCallback(async () => {
    if (!activeEmail) return;
    const list = (activeEmail as any).attachments as Array<{ name: string; url: string }> | undefined;
    if (!list || list.length === 0) return;
    try {
      setDetailDownloading(true);
      for (const a of list) {
        try { await downloadBlob(a.url, a.name); } catch (e) { console.error(e); }
      }
      toast.success('Downloads started');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to download attachments');
    } finally {
      setDetailDownloading(false);
    }
  }, [activeEmail, downloadBlob]);

  const openEmail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      
      const res = await fetch(`/api/emails/${id}`, { cache: 'no-store' });
      
      if (res.status === 401 || res.status === 403) {
        toast.error('Your session expired. Please login again.');
        router.push('/login');
        return;
      }
      
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `Failed to load email (${res.status})`);
      }
      
      const data = await res.json();
      
      const clientEmail = toClientEmail(data);
      // Include recipients if returned from API
      if (Array.isArray((data as any).recipients)) {
        (clientEmail as any).recipients = (data as any).recipients;
      }
      if (Array.isArray((data as any).attachments)) {
        (clientEmail as any).attachments = (data as any).attachments;
      }
      setActiveEmail(clientEmail);
      
      if (!clientEmail.isRead) {
        // Mark as read in backend
        const csrf = await getCsrfToken();
        await fetch(`/api/emails/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
          body: JSON.stringify({ isRead: true }),
        });
        // Update local list state
        setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e));
        setActiveEmail(prev => prev ? { ...prev, isRead: true } : prev);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to open email');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }, [getCsrfToken, router]);

  const closeEmail = useCallback(() => {
    setActiveEmail(null);
    setDetailOpen(false);
  }, []);

  // Rely on server-side filtering/sorting/pagination
  const filteredEmails = emails;

  const bulkUpdate = useCallback(async (update: Partial<Pick<Email, 'isRead' | 'isStarred'>> & { type?: 'INBOX' | 'SENT' | 'DRAFT' | 'SPAM' | 'TRASH' }) => {
    const ids = [...selectedItems];
    if (ids.length === 0) return;
    try {
      const csrf = await getCsrfToken();
      await Promise.all(ids.map(id => fetch(`/api/emails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        body: JSON.stringify({
          ...(typeof update.isRead === 'boolean' ? { isRead: update.isRead } : {}),
          ...(typeof update.isStarred === 'boolean' ? { isStarred: update.isStarred } : {}),
          ...(update.type ? { type: update.type } : {}),
        })
      })));
      setEmails(prev => prev.map(e => ids.includes(e.id) ? {
        ...e,
        ...(typeof update.isRead === 'boolean' ? { isRead: update.isRead } : {}),
        ...(typeof update.isStarred === 'boolean' ? { isStarred: update.isStarred } : {}),
        ...(update.type ? { type: update.type } : {}),
      } : e));
      setSelectedItems([]);
      toast.success('Updated selected emails');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Bulk update failed');
    }
  }, [selectedItems]);

  // Individual email action handlers
  const handleStarEmail = useCallback(async (id: string, isStarred: boolean) => {
    try {
      const prevState = emails.find(e => e.id === id)?.isStarred;
      setEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred } : e));
      const csrf = await getCsrfToken();
      const res = await fetch(`/api/emails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        body: JSON.stringify({ isStarred })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(isStarred ? 'Email starred' : 'Email unstarred', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const csrf2 = await getCsrfToken();
              await fetch(`/api/emails/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(csrf2 ? { 'x-csrf-token': csrf2 } : {}) },
                body: JSON.stringify({ isStarred: prevState })
              });
              setEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred: Boolean(prevState) } : e));
            } catch {}
          }
        },
        duration: 6000,
      });
    } catch (e: any) {
      console.error(e);
      setEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred: !isStarred } : e));
      toast.error(e.message || 'Failed to update email');
    }
  }, [getCsrfToken, emails]);

  const handleMarkAsRead = useCallback(async (id: string, isRead: boolean) => {
    try {
      const prevState = emails.find(e => e.id === id)?.isRead;
      setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead } : e));
      const csrf = await getCsrfToken();
      const res = await fetch(`/api/emails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        body: JSON.stringify({ isRead })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(isRead ? 'Email marked as read' : 'Email marked as unread', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const csrf2 = await getCsrfToken();
              await fetch(`/api/emails/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(csrf2 ? { 'x-csrf-token': csrf2 } : {}) },
                body: JSON.stringify({ isRead: prevState })
              });
              setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: Boolean(prevState) } : e));
            } catch {}
          }
        },
        duration: 6000,
      });
    } catch (e: any) {
      console.error(e);
      setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: !isRead } : e));
      toast.error(e.message || 'Failed to update email');
    }
  }, [getCsrfToken, emails]);

  const handleMoveToFolder = useCallback(async (id: string) => {
    // For now, we'll move to trash. In a full implementation, you'd show a folder selection dialog
    try {
      const csrf = await getCsrfToken();
      await fetch(`/api/emails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        body: JSON.stringify({ type: 'TRASH' })
      });
      setEmails(prev => prev.map(e => e.id === id ? { ...e, type: 'TRASH' } : e));
      toast.success('Email moved to trash');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to move email');
    }
  }, []);

  const handleMoveToSpecificFolder = useCallback(async (id: string, folder: 'INBOX' | 'SENT' | 'DRAFT' | 'SPAM' | 'TRASH') => {
    try {
      const csrf = await getCsrfToken();
      const prevType = emails.find(e => e.id === id)?.type;
      setEmails(prev => prev.map(e => e.id === id ? { ...e, type: folder } : e));
      const res = await fetch(`/api/emails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        body: JSON.stringify({ type: folder })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'Failed to move email');
      }
      toast.success(`Moved to ${folder}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const csrf2 = await getCsrfToken();
              await fetch(`/api/emails/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(csrf2 ? { 'x-csrf-token': csrf2 } : {}) },
                body: JSON.stringify({ type: prevType })
              });
              setEmails(prev => prev.map(e => e.id === id ? { ...e, type: prevType as any } : e));
            } catch {}
          }
        },
        duration: 6000,
      });
    } catch (e: any) {
      console.error(e);
      // revert optimistic
      setEmails(prev => prev.map(e => e.id === id ? { ...e, type: emails.find(x => x.id === id)?.type || e.type } : e));
      toast.error(e.message || 'Failed to move email');
    }
  }, [getCsrfToken, emails]);

  // Delete functionality
  const handleDeleteEmail = useCallback(async () => {
    if (!selectedEmail) return;
    
    try {
      setIsDeleting(true);
      const csrf = await getCsrfToken();
      
      // Soft delete by moving to trash
      const res = await fetch(`/api/emails/${selectedEmail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        body: JSON.stringify({ type: 'TRASH' })
      });
      
      if (res.status === 401 || res.status === 403) {
        toast.error('Your session expired. Please login again.');
        router.push('/login');
        return;
      }
      
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'Failed to delete email');
      }
      
      // Update local state
      setEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, type: 'TRASH' } : e));
      setSelectedItems(prev => prev.filter(id => id !== selectedEmail.id));
      
      toast.success('Email moved to trash', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const csrf2 = await getCsrfToken();
              await fetch(`/api/emails/${selectedEmail.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(csrf2 ? { 'x-csrf-token': csrf2 } : {}) },
                body: JSON.stringify({ type: 'INBOX' })
              });
              setEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, type: 'INBOX' } : e));
            } catch {}
          }
        },
        duration: 6000,
      });
      
      setDeleteModalOpen(false);
      setSelectedEmail(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to delete email');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedEmail, getCsrfToken, router, emails, selectedItems]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) return;
    
    try {
      setIsDeleting(true);
      const csrf = await getCsrfToken();
      
      // Move all selected emails to trash
      await Promise.all(selectedItems.map(id => fetch(`/api/emails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        body: JSON.stringify({ type: 'TRASH' })
      })));
      
      // Update local state
      setEmails(prev => prev.map(e => selectedItems.includes(e.id) ? { ...e, type: 'TRASH' } : e));
      setSelectedItems([]);
      
      toast.success(`Moved ${selectedItems.length} email${selectedItems.length === 1 ? '' : 's'} to trash`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to delete emails');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedItems, getCsrfToken]);

  const stats = {
    total: total,
    inbox: serverStats?.byFolder.inbox ?? 0,
    sent: serverStats?.byFolder.sent ?? 0,
    draft: serverStats?.byFolder.draft ?? 0,
    unread: serverStats?.unread ?? 0,
    important: emails.filter(e => e.isImportant).length,
    starred: emails.filter(e => e.isStarred).length,
    failed: serverStats?.failed ?? 0,
  };

  // Print functionality
  const handlePrintEmails = useCallback(() => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }

      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email List - ${currentDate}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #1e40af;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #1e40af;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .header p {
              margin: 0;
              color: #666;
              font-size: 14px;
            }
            .stats {
              display: flex;
              justify-content: space-around;
              margin-bottom: 30px;
              padding: 15px;
              background-color: #f8fafc;
              border-radius: 8px;
            }
            .stat-item {
              text-align: center;
            }
            .stat-value {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              margin-top: 4px;
            }
            .filters {
              margin-bottom: 20px;
              padding: 10px;
              background-color: #f1f5f9;
              border-radius: 6px;
              font-size: 14px;
            }
            .email-list {
              margin-top: 20px;
            }
            .email-item {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              background-color: white;
            }
            .email-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
            }
            .email-subject {
              font-weight: bold;
              color: #1e40af;
              font-size: 16px;
              margin: 0;
            }
            .email-status {
              background-color: #dbeafe;
              color: #1e40af;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            .email-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 14px;
              color: #666;
            }
            .email-preview {
              color: #666;
              font-size: 14px;
              margin-bottom: 10px;
              line-height: 1.4;
            }
            .email-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
            }
            .priority-badge {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
            }
            .priority-urgent { background-color: #fef2f2; color: #dc2626; }
            .priority-high { background-color: #fff7ed; color: #ea580c; }
            .priority-normal { background-color: #eff6ff; color: #2563eb; }
            .priority-low { background-color: #f9fafb; color: #6b7280; }
            .read-status {
              font-weight: 500;
            }
            .read-status.unread { color: #2563eb; }
            .read-status.read { color: #6b7280; }
            .starred {
              color: #f59e0b;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .email-item { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Email Management Report</h1>
            <p>Generated on ${currentDate}</p>
          </div>
          
          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${stats.total}</div>
              <div class="stat-label">Total Emails</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats.inbox}</div>
              <div class="stat-label">Inbox</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats.sent}</div>
              <div class="stat-label">Sent</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats.unread}</div>
              <div class="stat-label">Unread</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats.failed}</div>
              <div class="stat-label">Failed</div>
            </div>
          </div>

          <div class="filters">
            <strong>Current Filters:</strong>
            ${searchValue ? `Search: "${searchValue}"` : ''}
            ${statusFilter !== 'all' ? ` | Status: ${statusFilter}` : ''}
            ${priorityFilter !== 'all' ? ` | Priority: ${priorityFilter}` : ''}
            ${folderFilter !== 'all' ? ` | Folder: ${folderFilter}` : ''}
          </div>

          <div class="email-list">
            ${filteredEmails.length === 0 ? 
              '<p style="text-align: center; color: #666; font-style: italic;">No emails to display</p>' :
              filteredEmails.map(email => `
                <div class="email-item">
                  <div class="email-header">
                    <h3 class="email-subject">${email.subject}</h3>
                    <span class="email-status">${email.status}</span>
                  </div>
                  <div class="email-meta">
                    <span><strong>From:</strong> ${email.sender}</span>
                    <span><strong>To:</strong> ${email.recipient}</span>
                  </div>
                  <div class="email-preview">
                    ${email.content ? email.content.substring(0, 200) + (email.content.length > 200 ? '...' : '') : 'No preview available'}
                  </div>
                  <div class="email-footer">
                    <div>
                      <span class="priority-badge priority-${email.priority.toLowerCase()}">${email.priority}</span>
                      <span class="read-status ${email.isRead ? 'read' : 'unread'}">${email.isRead ? 'Read' : 'Unread'}</span>
                      ${email.isStarred ? '<span class="starred"> ⭐ Starred</span>' : ''}
                    </div>
                    <div>
                      ${new Date(email.timestamp).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };

      toast.success('Print dialog opened');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to open print dialog');
    }
  }, [filteredEmails, stats, searchValue, statusFilter, priorityFilter, folderFilter]);

  const getStatusIcon = (status: Email['status']) => {
    switch (status) {
      case 'SENT': return <Send className="w-4 h-4 text-green-500" />;
      case 'DELIVERED': return <MailCheck className="w-4 h-4 text-blue-500" />;
      case 'READ': return <MailOpen className="w-4 h-4 text-blue-600" />;
      case 'FAILED': return <MailX className="w-4 h-4 text-red-500" />;
      case 'DRAFT': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Email['priority']) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: Email['status']) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-700 border-green-200';
      case 'DELIVERED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'READ': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'FAILED': return 'bg-red-100 text-red-700 border-red-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="Email Management"
          subtitle="View and manage all email communications"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Email" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Inbox className="text-blue-500 w-5 h-5" />}
            label="Inbox"
            value={stats.inbox}
            valueClassName="text-blue-900"
            sublabel="Unread emails"
          />
          <SummaryCard
            icon={<Send className="text-blue-500 w-5 h-5" />}
            label="Sent"
            value={stats.sent}
            valueClassName="text-blue-900"
            sublabel="Sent emails"
          />
          <SummaryCard
            icon={<FileText className="text-blue-500 w-5 h-5" />}
            label="Drafts"
            value={stats.draft}
            valueClassName="text-blue-900"
            sublabel="Draft emails"
          />
          <SummaryCard
            icon={<MailX className="text-blue-500 w-5 h-5" />}
            label="Failed"
            value={stats.failed}
            valueClassName="text-blue-900"
            sublabel="Failed deliveries"
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential email tools"
            icon={
              <div className="w-6 h-6 text-white">
                <Mail className="w-6 h-6" />
              </div>
            }
            actionCards={[
              {
                id: 'compose-email',
                label: 'Compose Email',
                description: 'Create new email',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => setComposeOpen(true)
              },
              {
                id: 'import-emails',
                label: 'Import Data',
                description: 'Import emails from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportOpen(true)
              },
              {
                id: 'print-emails',
                label: 'Print Page',
                description: 'Print email list',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => handlePrintEmails()
              },
              {
                id: 'refresh-data',
                label: 'Refresh Data',
                description: 'Reload email data',
                icon: <RefreshCw className="w-5 h-5 text-white" />,
                onClick: async () => { await fetchEmails(); toast.success("Data refreshed!"); }
              }
            ]}
            lastActionTime="2 minutes ago"
            onLastActionTimeChange={() => {}}
            collapsible={true}
            defaultCollapsed={true}
            onCollapseChange={(collapsed) => {
              console.log('Quick Actions Panel collapsed:', collapsed);
            }}
          />
        </div>

        {/* Main Content Area */}
        <div className="w-full max-w-full pt-4">
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full">
            <CardHeader className="p-0">
              {/* Blue Gradient Header */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Email List</h3>
                      <p className="text-blue-100 text-sm">Search and filter email communications</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Search and Filter Section */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-between">
                {/* Search + Quick Filter Dropdowns (right aligned) */}
                <div className="w-full xl:flex-1 flex flex-wrap gap-2 sm:gap-3 items-center justify-end">
                  <div className="relative w-full sm:w-auto sm:min-w-[240px] sm:max-w-md order-1 xl:order-none">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none placeholder:text-gray-400"
                  />
                </div>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full sm:w-auto sm:min-w-[140px] text-gray-500 rounded border border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value)}>
                    <SelectTrigger className="w-full sm:w-auto sm:min-w-[140px] text-gray-500 rounded border border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                    <SelectTrigger className="w-full sm:w-auto sm:min-w-[140px] text-gray-500 rounded border border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="timestamp">Date</SelectItem>
                      <SelectItem value="subject">Subject</SelectItem>
                      <SelectItem value="sender">Sender</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                    <SelectTrigger className="w-full sm:w-auto sm:min-w-[110px] text-gray-500 rounded border border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Desc</SelectItem>
                      <SelectItem value="asc">Asc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Folders Section */}
            <div className="border-b border-gray-200 bg-gray-50/50 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'inbox', label: 'Inbox' },
                  { key: 'sent', label: 'Sent' },
                  { key: 'draft', label: 'Drafts' },
                  { key: 'spam', label: 'Spam' },
                  { key: 'trash', label: 'Trash' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFolderFilter(f.key)}
                    className={`px-3 py-1 rounded-full text-xs border transition ${folderFilter === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email List */}
            <div className="relative px-2 sm:px-3 lg:px-6 mt-3 sm:mt-4 lg:mt-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative">
                <div className="px-2 sm:px-0 py-2 flex items-center gap-3">
                  <Checkbox
                    checked={allSelectedOnPage}
                    onCheckedChange={toggleSelectAllOnPage}
                    aria-label="Select all on page"
                  />
                  <span className="text-sm text-gray-600">
                    {allSelectedOnPage ? 'All on page selected' : someSelectedOnPage ? 'Some selected' : 'None selected'}
                  </span>
                </div>
                {selectedItems.length > 0 && (
                  <div className="px-2 sm:px-0 py-2">
                    <BulkActionsBar
                      selectedCount={selectedItems.length}
                      entityLabel="email"
                      actions={[
                        {
                          key: 'mark-read',
                          label: 'Mark read',
                          icon: <Mail className="w-4 h-4 mr-2" />,
                          onClick: () => bulkUpdate({ isRead: true }),
                          hidden: !selectedMeta.anyUnread,
                        },
                        {
                          key: 'mark-unread',
                          label: 'Mark unread',
                          icon: <MailOpen className="w-4 h-4 mr-2" />,
                          onClick: () => bulkUpdate({ isRead: false }),
                          hidden: !selectedMeta.anyRead,
                        },
                        {
                          key: 'star',
                          label: 'Star',
                          icon: <Star className="w-4 h-4 mr-2" />,
                          onClick: () => bulkUpdate({ isStarred: true }),
                          hidden: !selectedMeta.anyUnstarred,
                        },
                        {
                          key: 'unstar',
                          label: 'Unstar',
                          icon: <Star className="w-4 h-4 mr-2" />,
                          onClick: () => bulkUpdate({ isStarred: false }),
                          hidden: !selectedMeta.anyStarred,
                        },
                        {
                          key: 'delete',
                          label: 'Delete Selected',
                          icon: <Trash2 className="w-4 h-4 mr-2" />,
                          onClick: handleBulkDelete,
                          variant: 'destructive',
                        },
                        {
                          key: 'move-folder',
                          label: 'Move to Folder',
                          icon: <Folder className="w-4 h-4 mr-2" />,
                          onClick: () => setBulkMoveOpen(true),
                        },
                      ]}
                      onClear={() => setSelectedItems([])}
                    />
                  </div>
                )}
                
                <div className="print-content">
                  {loading ? (
                    <div className="space-y-3 px-2 sm:px-0 py-2">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded border bg-white">
                          <div className="h-4 w-4 rounded border bg-gray-100" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                            <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                            <div className="flex items-center gap-2">
                              <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
                              <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
                              <div className="h-3 bg-gray-100 rounded w-14 animate-pulse" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                            <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                            <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                            <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<Mail className="w-6 h-6 text-blue-400" />}
                        title={searchValue || statusFilter !== 'all' || priorityFilter !== 'all' || folderFilter !== 'all' ? 'No matching emails' : 'No emails yet'}
                        description={searchValue || statusFilter !== 'all' || priorityFilter !== 'all' || folderFilter !== 'all'
                          ? 'Try adjusting search, status, priority, or folder filters.'
                          : 'Compose a new email to get started.'}
                        action={
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                              onClick={() => setSearchValue('')}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Clear Filters
                            </Button>
                            {!searchValue && statusFilter === 'all' && priorityFilter === 'all' && folderFilter === 'all' && (
                              <Button
                                className="rounded-xl"
                                onClick={() => setComposeOpen(true)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Compose Email
                              </Button>
                            )}
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-2" ref={listContainerRef} onScroll={(e) => setListScrollTop((e.currentTarget as HTMLDivElement).scrollTop)} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                      {(() => {
                        const totalRows = filteredEmails.length;
                        const startIndex = Math.max(0, Math.floor(listScrollTop / estimatedRowHeight) - 5);
                        const visibleCount = Math.ceil((listViewportH || 600) / estimatedRowHeight) + 10;
                        const endIndex = Math.min(totalRows, startIndex + visibleCount);
                        const topSpacerH = startIndex * estimatedRowHeight;
                        const bottomSpacerH = Math.max(0, (totalRows - endIndex) * estimatedRowHeight);
                        const slice = filteredEmails.slice(startIndex, endIndex);
                        return (
                          <>
                            <div style={{ height: `${topSpacerH}px` }} />
                            {slice.map((item) => (
                        <div
                          key={item.id}
                          className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer"
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-4 left-4 z-10">
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={() => {
                                setSelectedItems(prev => 
                                  prev.includes(item.id) 
                                    ? prev.filter(id => id !== item.id)
                                    : [...prev, item.id]
                                );
                              }}
                              aria-label={`Select ${item.subject}`}
                              className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                          </div>

                          {/* Main Content */}
                          <div className="ml-12 flex items-start gap-4">
                            {/* Content Area */}
                            <div className="flex-1 min-w-0">
                              {/* Header Row */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-semibold text-blue-600 truncate ${!item.isRead ? 'font-bold' : ''}`}>
                                      {item.subject}
                                    </h4>
                                    {item.isStarred && (
                                      <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
                                        ⭐ Starred
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                    {item.content || 'No preview available'}
                                  </p>
                                </div>
                                
                                {/* Status Badge */}
                                <div className="flex-shrink-0 ml-4">
                                  <Badge className={`text-xs font-medium px-3 py-1 ${getStatusColor(item.status)} hover:${getStatusColor(item.status)}`}>
                                    {item.status}
                                  </Badge>
                                </div>
                              </div>

                              {/* Metadata Row */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-4">
                                  {/* Sender Info */}
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-700">From: {item.sender}</span>
                                  </div>
                                  
                                  {/* Arrow */}
                                  <span className="text-gray-400">→</span>
                                  
                                  {/* Recipient Info */}
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-700">To: {item.recipient}</span>
                                  </div>
                                </div>

                                {/* Timestamp */}
                                <div className="flex items-center gap-1 text-gray-500">
                                  <span>{new Date(item.timestamp).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                </div>
                              </div>

                              {/* Additional Info Row */}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  {/* Priority Badge */}
                                  <div className="flex items-center gap-1">
                                    <Badge className={`text-xs font-medium px-2 py-1 ${getPriorityColor(item.priority)} hover:${getPriorityColor(item.priority)}`}>
                                      {item.priority}
                                    </Badge>
                                  </div>
                                  
                                  {/* Read Status */}
                                  <div className="flex items-center gap-1">
                                    <span className={item.isRead ? 'text-gray-400' : 'text-blue-600 font-medium'}>
                                      {item.isRead ? 'Read' : 'Unread'}
                                    </span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex-shrink-0 flex items-center gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          aria-label={item.isStarred ? "Unstar email" : "Star email"}
                                          className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                          disabled={loading}
                                          onClick={() => handleStarEmail(item.id, !item.isStarred)}
                                        >
                                          <Star className={`h-4 w-4 ${item.isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                                        {item.isStarred ? "Unstar" : "Star"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          aria-label={item.isRead ? "Mark as unread" : "Mark as read"}
                                          className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                          disabled={loading}
                                          onClick={() => handleMarkAsRead(item.id, !item.isRead)}
                                        >
                                          {item.isRead ? (
                                            <Mail className="h-4 w-4 text-gray-400" />
                                          ) : (
                                            <MailOpen className="h-4 w-4 text-green-600" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                                        {item.isRead ? "Mark as unread" : "Mark as read"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          aria-label="View email"
                                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                          disabled={loading}
                                          onClick={() => openEmail(item.id)}
                                        >
                                          <Eye className="h-4 w-4 text-blue-600" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                                        View details
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          aria-label="Delete email"
                                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                          disabled={loading}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedEmail(item);
                                            setDeleteModalOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                                        Delete email
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Hover Effect Border */}
                          <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-200 transition-colors pointer-events-none"></div>
                        </div>
                      ))}
                            <div style={{ height: `${bottomSpacerH}px` }} />
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="px-2 sm:px-0 pb-2">
                  <TablePagination
                    page={page}
                    pageSize={pageSize}
                    totalItems={total}
                    onPageChange={(p) => setPage(p)}
                    onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    loading={loading}
                    entityLabel="email"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <EmailDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        email={activeEmail}
        isLoading={detailLoading}
        onReply={(email) => {
          const original = (email as any);
          const toList = original.recipients ? (original.recipients as any[]).filter((r) => r.rtype === 'TO').map(r => r.address) : [email.recipient];
          setComposeData(d => ({
            ...d,
            subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
            recipient: toList.join(', '),
            cc: '',
            bcc: '',
            content: `\n\nOn ${new Date(email.timestamp).toLocaleString()}, ${email.sender} wrote:\n${email.content}`,
          }));
          setComposeOpen(true);
        }}
        onReplyAll={(email) => {
          const original = (email as any);
          const toList = original.recipients ? (original.recipients as any[]).filter((r) => r.rtype === 'TO').map(r => r.address) : [email.recipient];
          const ccList = original.recipients ? (original.recipients as any[]).filter((r) => r.rtype === 'CC').map(r => r.address) : [];
          setComposeData(d => ({
            ...d,
            subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
            recipient: toList.join(', '),
            cc: ccList.join(', '),
            bcc: '',
            content: `\n\nOn ${new Date(email.timestamp).toLocaleString()}, ${email.sender} wrote:\n${email.content}`,
          }));
          setComposeOpen(true);
        }}
        onForward={(email) => {
          setComposeData(d => ({
            ...d,
            subject: email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`,
            recipient: '',
            cc: '',
            bcc: '',
            content: `\n\n---------- Forwarded message ---------\nFrom: ${email.sender}\nDate: ${new Date(email.timestamp).toLocaleString()}\nSubject: ${email.subject}\nTo: ${email.recipient}\n\n${email.content}`,
          }));
          setComposeOpen(true);
        }}
        onPrint={handlePrintEmails}
        onDownloadAttachments={handleDownloadAllAttachments}
        isDownloadingAttachments={detailDownloading}
      />
      <EmailComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        initialData={composeData}
        onSend={async (data) => {
          try {
            setComposeSending(true);
            const csrf = await getCsrfToken();
            const res = await fetch('/api/emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
              body: JSON.stringify({
                subject: data.subject,
                sender: data.sender,
                recipient: data.recipient,
                recipients: [
                  ...(data.recipient ? data.recipient.split(',').map(s => s.trim()).filter(Boolean).map(address => ({ address, rtype: 'TO' })) : []),
                  ...(data.cc ? data.cc.split(',').map(s => s.trim()).filter(Boolean).map(address => ({ address, rtype: 'CC' })) : []),
                  ...(data.bcc ? data.bcc.split(',').map(s => s.trim()).filter(Boolean).map(address => ({ address, rtype: 'BCC' })) : []),
                ],
                content: data.content,
                priority: data.priority,
                type: 'SENT',
                status: 'SENT',
                attachments: data.attachments,
              })
            });
            if (res.status === 401 || res.status === 403) {
              toast.error('Your session expired. Please login again.');
              router.push('/login');
              return;
            }
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to send email');
            }
            
            const responseData = await res.json();
            const emailStatus = responseData.status;
            
            if (emailStatus === 'SENT') {
              toast.success('Email sent successfully!');
            } else if (emailStatus === 'FAILED') {
              toast.error('Email failed to send. Please check your SMTP configuration.');
            } else {
              toast.success('Email queued for sending');
            }
            setComposeData({ subject: '', sender: data.sender, recipient: '', cc: '', bcc: '', content: '', priority: 'NORMAL' as const });
            await fetchEmails();
          } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Failed to send email');
            throw e; // Re-throw to let the dialog handle the error state
          } finally {
            setComposeSending(false);
          }
        }}
        isLoading={composeSending}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityName="Emails"
        onImport={async (rows) => {
          try {
            // Map imported rows to Email create payloads
            const makeArray = (val: any): string[] => {
              if (!val) return [];
              if (Array.isArray(val)) return val;
              return String(val).split(',').map((s: string) => s.trim()).filter(Boolean);
            };

            let success = 0;
            const failedErrors: string[] = [];
            for (const r of rows) {
              try {
                const subject = (r as any).subject || (r as any).Subject || 'No subject';
                const sender = (r as any).sender || (r as any).from || composeData.sender;
                const recipient = (r as any).recipient || (r as any).to || '';
                const content = (r as any).content || (r as any).body || '';
                const priority = ((r as any).priority || 'NORMAL').toString().toUpperCase(); // LOW, NORMAL, HIGH, URGENT
                const folder = ((r as any).folder || (r as any).type || 'INBOX').toString().toUpperCase(); // EmailFolder
                const status = ((r as any).status || 'PENDING').toString().toUpperCase(); // EmailStatus
                const toList = (() => {
                  const combined = makeArray((r as any).recipients);
                  const toOnly = makeArray((r as any).to);
                  return combined.length > 0 ? combined : toOnly;
                })();
                const ccList = makeArray((r as any).cc);
                const bccList = makeArray((r as any).bcc);
                const attachmentUrls = makeArray((r as any).attachments);
                const attachmentNames = makeArray((r as any).attachmentNames);
                const attachments = attachmentUrls.map((url, i) => ({ name: attachmentNames[i] || url.split('/').pop() || 'file', url }));

                if (!recipient && toList.length === 0) {
                  throw new Error('Missing recipient');
                }

                const csrf = await getCsrfToken();
                const res = await fetch('/api/emails', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
                  body: JSON.stringify({
                    subject,
                    sender,
                    recipient: recipient || toList[0],
                    recipients: [
                      ...toList.map(address => ({ address, rtype: 'TO' as const })),
                      ...ccList.map(address => ({ address, rtype: 'CC' as const })),
                      ...bccList.map(address => ({ address, rtype: 'BCC' as const })),
                    ],
                    content,
                    priority,
                    type: folder,
                    status,
                    attachments,
                  })
                });
                if (!res.ok) throw new Error(await res.text());
                success += 1;
              } catch (e: any) {
                failedErrors.push(e?.message || 'Unknown error');
              }
            }

            // Refresh list
            await fetchEmails();
            toast.success(`Imported ${success} email${success === 1 ? '' : 's'}`);
            return { success, failed: failedErrors.length, errors: failedErrors };
          } catch (e: any) {
            return { success: 0, failed: rows.length, errors: [e?.message || 'Import failed'] };
          }
        }}
        templateUrl={undefined}
        acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
        maxFileSize={5}
      />
      <EmailBulkMoveDialog
        open={bulkMoveOpen}
        onOpenChange={setBulkMoveOpen}
        selectedCount={selectedItems.length}
        onMove={async (folder) => {
          await bulkUpdate({ type: folder });
        }}
      />
      <ConfirmDeleteDialog
        open={deleteModalOpen}
        onOpenChange={(open: boolean) => {
          setDeleteModalOpen(open);
          if (!open) setSelectedEmail(null);
        }}
        itemName={selectedEmail?.subject}
        onDelete={handleDeleteEmail}
        onCancel={() => { setDeleteModalOpen(false); setSelectedEmail(null); }}
        canDelete={!isDeleting}
        deleteError={undefined}
        description={selectedEmail ? `Are you sure you want to delete the email "${selectedEmail.subject}"? This will move it to trash.` : undefined}
      />
    </div>
  );
} 