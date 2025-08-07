"use client";

import PageHeader from '@/components/PageHeader/PageHeader';
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { CompactPagination, Pagination } from "@/components/Pagination";
import { 
  CreditCard, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload,
  Edit,
  Trash2,
  User,
  Clock,
  MapPin,
  AlertTriangle
} from "lucide-react";

interface RFIDTag {
  id: string;
  tagId: string;
  studentId?: string;
  studentName?: string;
  status: 'active' | 'inactive' | 'lost' | 'damaged';
  assignedDate: string;
  lastSeen: string;
  location: string;
  scanCount: number;
  batteryLevel?: number;
}

export default function RFIDTagsPage() {
  const [tags, setTags] = useState<RFIDTag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTags([
        {
          id: '1', tagId: 'RFID-001', studentId: 'STU001', studentName: 'John Doe', status: 'active', assignedDate: '2024-01-01', lastSeen: '2024-01-15 14:30:25', location: 'Room 101', scanCount: 156, batteryLevel: 85,
        },
        {
          id: '2', tagId: 'RFID-002', studentId: 'STU002', studentName: 'Jane Smith', status: 'active', assignedDate: '2024-01-01', lastSeen: '2024-01-15 14:29:18', location: 'Room 102', scanCount: 142, batteryLevel: 92,
        },
        {
          id: '3', tagId: 'RFID-003', studentId: 'STU003', studentName: 'Mike Johnson', status: 'lost', assignedDate: '2024-01-01', lastSeen: '2024-01-14 09:15:30', location: 'Unknown', scanCount: 89, batteryLevel: 45,
        },
        {
          id: '4', tagId: 'RFID-004', status: 'inactive', assignedDate: '2024-01-01', lastSeen: 'Never', location: 'Storage', scanCount: 0,
        },
      ]);
      setLoading(false);
      setLastUpdated(new Date());
    }, 1000);
  }, []);

  const filteredTags = useMemo(() => tags.filter(tag => {
    const matchesSearch = tag.tagId.toLowerCase().includes(searchTerm.toLowerCase()) || tag.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || tag.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tag.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [tags, searchTerm, statusFilter]);

  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTags.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTags, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTags.length / itemsPerPage);

  const stats = useMemo(() => ({
    total: tags.length,
    active: tags.filter(t => t.status === 'active').length,
    inactive: tags.filter(t => t.status === 'inactive').length,
    lost: tags.filter(t => t.status === 'lost').length,
    damaged: tags.filter(t => t.status === 'damaged').length,
  }), [tags]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Active</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      case 'lost': return <Badge variant="destructive">Lost</Badge>;
      case 'damaged': return <Badge variant="destructive">Damaged</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level > 80) return 'text-green-500';
    if (level > 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Top bar actions
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
    }, 1000);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="RFID Tags"
          subtitle="Manage and monitor RFID tags assigned to students"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'RFID Management', href: '/rfid' },
            { label: 'Tags' }
          ]}
        />

        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-blue-100 pb-2 mb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <Button onClick={handleRefresh} variant="outline" size="sm" aria-label="Refresh tags" disabled={loading} className="gap-2">
                <Download className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
            <Button size="sm" className="gap-2" aria-label="Add new tag">
              <Plus className="h-4 w-4" />
              Add Tag
            </Button>
          </div>
        </div>

        {/* Analytics Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-4">
            <CreditCard className="h-6 w-6 text-blue-500" aria-label="Total Tags" />
            <span className="font-semibold text-blue-900">{stats.total}</span>
            <span className="text-sm text-blue-700">Total</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 rounded-lg p-4">
            <Badge className="h-6 w-6 bg-green-500 text-white" aria-label="Active Tags">A</Badge>
            <span className="font-semibold text-green-900">{stats.active}</span>
            <span className="text-sm text-green-700">Active</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-4">
            <Badge className="h-6 w-6 bg-gray-500 text-white" aria-label="Inactive Tags">I</Badge>
            <span className="font-semibold text-gray-900">{stats.inactive}</span>
            <span className="text-sm text-gray-700">Inactive</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 rounded-lg p-4">
            <Badge className="h-6 w-6 bg-red-500 text-white" aria-label="Lost Tags">L</Badge>
            <span className="font-semibold text-red-900">{stats.lost}</span>
            <span className="text-sm text-red-700">Lost</span>
          </div>
          <div className="flex items-center gap-2 bg-yellow-50 rounded-lg p-4">
            <Badge className="h-6 w-6 bg-yellow-500 text-white" aria-label="Damaged Tags">D</Badge>
            <span className="font-semibold text-yellow-900">{stats.damaged}</span>
            <span className="text-sm text-yellow-700">Damaged</span>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tags Management</CardTitle>
            <CardDescription>Search and filter RFID tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tag ID, student name, or student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="lost">Lost</option>
                <option value="damaged">Damaged</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>

            {/* Tags Table */}
            <div className="border rounded-lg">
              {loading ? (
                <div className="p-8">
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-8 w-full mb-4" />
                </div>
              ) : paginatedTags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <CreditCard className="h-12 w-12 text-blue-200 mb-4" />
                  <div className="font-semibold text-lg text-blue-700 mb-2">No RFID Tags Found</div>
                  <div className="text-sm text-muted-foreground mb-4">Get started by adding your first tag.</div>
                  <Button size="sm" className="gap-2" aria-label="Add new tag">
                    <Plus className="h-4 w-4" />
                    Add Tag
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Scans</TableHead>
                      <TableHead>Battery</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTags.map((tag) => (
                      <TableRow key={tag.id} className="transition-all duration-150 hover:bg-blue-50">
                        <TableCell className="font-medium">{tag.tagId}</TableCell>
                        <TableCell>
                          {tag.studentName ? (
                            <div>
                              <div className="font-medium">{tag.studentName}</div>
                              <div className="text-sm text-muted-foreground">{tag.studentId}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(tag.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-sm">{tag.lastSeen}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="text-sm">{tag.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>{tag.scanCount}</TableCell>
                        <TableCell>
                          {tag.batteryLevel ? (
                            <div className="flex items-center gap-1">
                              <span className={`text-sm ${getBatteryColor(tag.batteryLevel)}`}>{tag.batteryLevel}%</span>
                              {tag.batteryLevel < 20 && (
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" aria-label="Edit tag">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" aria-label="Delete tag">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            {/* Pagination */}
            <div className="hidden xl:block mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTags.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
            <div className="block xl:hidden mt-4">
              <CompactPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
} 