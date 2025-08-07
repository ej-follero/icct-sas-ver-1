"use client";

import { useState, useCallback } from "react";
import { Pagination } from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/reusable/Search/TableSearch";
import { announcementsData, role } from "@/lib/data";
import { EmptyState, PageHeader } from "@/components/reusable";
import { Announcement, AnnouncementStatus } from "@/types/announcement";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Filter, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash2, 
  Bell, 
  Search, 
  AlertCircle,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowUpDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SortField = 'date' | 'title' | 'class' | 'status';
type SortOrder = 'asc' | 'desc';

const columns = [
  {
    header: "Title",
    accessor: "title",
    sortable: true,
  },
  {
    header: "Class",
    accessor: "class",
    sortable: true,
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
    sortable: true,
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
    sortable: true,
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const statusColors = {
  important: { bg: "bg-red-100", text: "text-red-700", hover: "hover:bg-red-200" },
  normal: { bg: "bg-blue-100", text: "text-blue-700", hover: "hover:bg-blue-200" },
  archived: { bg: "bg-gray-100", text: "text-gray-700", hover: "hover:bg-gray-200" },
};

const AnnouncementListPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "all">("all");
  const itemsPerPage = 10;

  // Simulate loading state
  useState(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  });

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField, sortOrder]);

  const filteredAnnouncements = announcementsData
    .filter((announcement) => {
      const matchesSearch = 
        announcement.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        announcement.class.toLowerCase().includes(searchValue.toLowerCase());
      const matchesStatus = statusFilter === "all" || announcement.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const modifier = sortOrder === "asc" ? 1 : -1;
      if (sortField === "date") {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * modifier;
      }
      return (a[sortField] > b[sortField] ? 1 : -1) * modifier;
    });

  const handleDelete = (id: number) => {
    // Handle delete logic here
    setDeleteConfirm(null);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    return sortOrder === "asc" ? 
      <ChevronDown className="w-4 h-4 ml-1 text-primary" /> : 
      <ChevronDown className="w-4 h-4 ml-1 text-primary transform rotate-180" />;
  };

  const renderRow = (item: Announcement) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50/50 text-sm hover:bg-slate-100 transition-colors cursor-pointer group"
      onClick={() => setSelectedAnnouncement(item)}
    >
      <td className="flex items-center gap-4 p-4">
        <div>
          <div className="font-medium group-hover:text-primary transition-colors">
            {item.title}
            {item.updatedAt && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="ml-2 text-xs">Updated</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Last updated: {item.updatedAt}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">{item.description}</div>
        </div>
      </td>
      <td>
        <Badge variant="outline" className="group-hover:border-primary transition-colors">
          {item.class}
        </Badge>
      </td>
      <td className="hidden md:table-cell text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {item.date}
        </div>
      </td>
      <td className="hidden md:table-cell">
        <Badge 
          variant="secondary" 
          className={`${statusColors[item.status].bg} ${statusColors[item.status].text} ${statusColors[item.status].hover}`}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Badge>
      </td>
      <td>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {role === "admin" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:bg-blue-50 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit announcement</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:bg-red-50 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(item.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete announcement</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <PageHeader
          title="Announcements"
          description="View and manage all announcements"
          icon={<Bell className="w-5 h-5" />}
        />

        {/* TOP */}
        <Card className="p-4 mt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <TableSearch 
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Search announcements..."
                className="pl-10 w-full"
              />
            </div>
            <div className="flex items-center gap-4 self-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Filter announcements"
                    className="rounded-full hover:bg-slate-100"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter("all")}
                    className={statusFilter === "all" ? "bg-slate-100" : ""}
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter("important")}
                    className={statusFilter === "important" ? "bg-slate-100" : ""}
                  >
                    Important
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter("normal")}
                    className={statusFilter === "normal" ? "bg-slate-100" : ""}
                  >
                    Normal
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter("archived")}
                    className={statusFilter === "archived" ? "bg-slate-100" : ""}
                  >
                    Archived
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Sort announcements"
                    className="rounded-full hover:bg-slate-100"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSort("date")}>
                    Date {sortField === "date" && renderSortIcon("date")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("title")}>
                    Title {sortField === "title" && renderSortIcon("title")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("class")}>
                    Class {sortField === "class" && renderSortIcon("class")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("status")}>
                    Status {sortField === "status" && renderSortIcon("status")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {role === "admin" && (
                <Button className="shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Announcement
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* LIST */}
        {filteredAnnouncements.length === 0 ? (
          <EmptyState
            icon={<AlertCircle className="w-10 h-10 text-gray-400" />}
            title="No announcements found"
            description={
              searchValue
                ? "Try adjusting your search or filters"
                : "Create your first announcement to get started"
            }
            action={
              role === "admin" && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              )
            }
          />
        ) : (
          <Card className="mt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <Table 
                columns={columns} 
                renderRow={renderRow} 
                data={filteredAnnouncements.slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )} 
              />
            </div>
          </Card>
        )}

        {/* PAGINATION */}
        {filteredAnnouncements.length > 0 && (
          <div className="mt-4">
            <Pagination 
              currentPage={currentPage}
              totalPages={Math.ceil(filteredAnnouncements.length / itemsPerPage)}
              totalItems={filteredAnnouncements.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Announcement Details Dialog */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAnnouncement?.title}
              <Badge 
                variant="secondary" 
                className={`${selectedAnnouncement?.status && statusColors[selectedAnnouncement.status].bg} ${selectedAnnouncement?.status && statusColors[selectedAnnouncement.status].text}`}
              >
                {selectedAnnouncement?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Badge variant="outline">{selectedAnnouncement?.class}</Badge>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {selectedAnnouncement?.date}
                  </div>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {selectedAnnouncement?.description}
                </p>
                <div className="text-xs text-gray-500">
                  Created: {selectedAnnouncement?.createdAt}
                  {selectedAnnouncement?.updatedAt && (
                    <span className="ml-2">
                      · Updated: {selectedAnnouncement?.updatedAt}
                    </span>
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {role === "admin" && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedAnnouncement(null)}>
                  Close
                </Button>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AnnouncementListPage;
