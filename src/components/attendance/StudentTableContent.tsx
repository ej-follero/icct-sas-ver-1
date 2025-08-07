import React from 'react';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TableCardView } from '@/components/reusable/Table/TableCardView';
import { EmptyState } from '@/components/reusable';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users } from 'lucide-react';

interface StudentTableContentProps {
  paginatedStudents: any[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  loading: boolean;
  filteredStudents: any[];
  refreshStudentsData: () => void;
  handleStudentClick: (student: any) => void;
  setViewStudent: (student: any) => void;
  setViewDialogOpen: (open: boolean) => void;
  canDeleteStudents: boolean;
  setStudentToDelete: (student: any) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  visibleColumns: string[];
  setExpandedRowIds: (ids: string[]) => void;
  expandedRowIds: string[];
  editingCell: any;
  setEditingCell: (cell: any) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  STUDENT_ATTENDANCE_COLUMNS: TableListColumn<any>[];
  EXPANDER_COLUMN: TableListColumn<any>;
  renderActionsColumn: TableListColumn<any>["render"];
}

const StudentTableContent: React.FC<StudentTableContentProps> = ({
  paginatedStudents,
  selectedIds,
  setSelectedIds,
  loading,
  filteredStudents,
  refreshStudentsData,
  handleStudentClick,
  setViewStudent,
  setViewDialogOpen,
  canDeleteStudents,
  setStudentToDelete,
  setDeleteDialogOpen,
  visibleColumns,
  setExpandedRowIds,
  expandedRowIds,
  editingCell,
  setEditingCell,
  sortBy,
  setSortBy,
  STUDENT_ATTENDANCE_COLUMNS,
  EXPANDER_COLUMN,
  renderActionsColumn,
}) => (
  <div className="relative">
    {/* Table layout for xl+ only */}
    <div className="hidden xl:block">
      <TableList
        columns={[
          EXPANDER_COLUMN,
          ...STUDENT_ATTENDANCE_COLUMNS.filter(col => 
            col.accessor !== 'actions' && visibleColumns.includes(col.accessor as string)
          ),
          {
            ...STUDENT_ATTENDANCE_COLUMNS.find(col => col.accessor === 'actions')!,
            render: renderActionsColumn
          }
        ].filter(col => visibleColumns.includes(col.accessor as string) || col.accessor === 'expander')}
        data={paginatedStudents}
        loading={loading}
        selectedIds={selectedIds}
        emptyMessage={null}
        onSelectRow={(id) => {
          setSelectedIds(
            selectedIds.includes(id)
              ? selectedIds.filter(selectedId => selectedId !== id)
              : [...selectedIds, id]
          );
        }}
        onSelectAll={() => {
          if (selectedIds.length === paginatedStudents.length) {
            setSelectedIds([]);
          } else {
            setSelectedIds(paginatedStudents.map(s => s.id));
          }
        }}
        isAllSelected={selectedIds.length === paginatedStudents.length && paginatedStudents.length > 0}
        isIndeterminate={selectedIds.length > 0 && selectedIds.length < paginatedStudents.length}
        getItemId={(item) => item.id}
        expandedRowIds={expandedRowIds}
        onToggleExpand={(itemId) => {
          setExpandedRowIds(
            expandedRowIds.includes(itemId)
              ? expandedRowIds.filter(id => id !== itemId)
              : [...expandedRowIds, itemId]
          );
        }}
        editingCell={editingCell}
        onCellClick={(item, columnAccessor) => {
          if (["studentName"].includes(columnAccessor)) {
            setEditingCell({ rowId: item.id, columnAccessor });
          }
        }}
        onCellChange={async (rowId, columnAccessor, value) => {
          setEditingCell(null);
          // Handle cell change logic here
        }}
        sortState={{
          field: sortBy === 'attendance-desc' || sortBy === 'attendance-asc' ? 'attendanceRate' : 
                 sortBy === 'name' ? 'studentName' : 
                 sortBy === 'id' ? 'studentId' : 
                 sortBy === 'department' ? 'department' : 
                 sortBy === 'course' ? 'course' : 
                 sortBy === 'year-level' ? 'yearLevel' : 
                 sortBy === 'status' ? 'status' : 'attendanceRate',
          order: sortBy === 'attendance-asc' || sortBy === 'name' || sortBy === 'id' || sortBy === 'department' || sortBy === 'course' || sortBy === 'year-level' || sortBy === 'status' ? 'asc' : 'desc'
        }}
        onSort={(accessor) => {
          if (accessor === 'attendanceRate') {
            setSortBy(sortBy === 'attendance-desc' ? 'attendance-asc' : 'attendance-desc');
          } else if (accessor === 'studentName') {
            setSortBy(sortBy === 'name' ? 'attendance-desc' : 'name');
          } else if (accessor === 'studentId') {
            setSortBy(sortBy === 'id' ? 'attendance-desc' : 'id');
          } else if (accessor === 'department') {
            setSortBy(sortBy === 'department' ? 'attendance-desc' : 'department');
          } else if (accessor === 'course') {
            setSortBy(sortBy === 'course' ? 'attendance-desc' : 'course');
          } else if (accessor === 'yearLevel') {
            setSortBy(sortBy === 'year-level' ? 'attendance-desc' : 'year-level');
          } else if (accessor === 'status') {
            setSortBy(sortBy === 'status' ? 'attendance-desc' : 'status');
          }
        }}
        className="border-0 shadow-none"
      />
    </div>
    {/* Card layout for small screens */}
    <div className="block xl:hidden p-4">
      {!loading && filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <EmptyState
            icon={<Users className="w-6 h-6 text-blue-400" />}
            title="No students found"
            description="Try adjusting your search criteria or filters to find the students you're looking for."
            action={
              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                  onClick={refreshStudentsData}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <TableCardView
          items={paginatedStudents}
          selectedIds={selectedIds}
          onSelect={(id) => {
            setSelectedIds(
              selectedIds.includes(id)
                ? selectedIds.filter(selectedId => selectedId !== id)
                : [...selectedIds, id]
            );
          }}
          onView={(item) => {
            setViewStudent(item);
            setViewDialogOpen(true);
          }}
          onEdit={(item) => {
            handleStudentClick(item);
          }}
          onDelete={(item) => {
            if (!canDeleteStudents) {
              // You may want to show a toast here
              return;
            }
            setStudentToDelete(item);
            setDeleteDialogOpen(true);
          }}
          getItemId={(item) => item.id}
          getItemName={(item) => item.studentName}
          getItemCode={(item) => item.studentId}
          getItemStatus={(item) => item.status === 'ACTIVE' ? 'active' : 'inactive'}
          getItemDescription={(item) => `${item.department} • ${item.course}`}
          getItemDetails={(item) => [
            { label: 'Year Level', value: item.yearLevel || 'N/A' },
            { label: 'Attendance Rate', value: `${item.attendanceRate}%` },
            { label: 'Present Days', value: item.presentDays || 0 },
            { label: 'Absent Days', value: item.absentDays || 0 },
          ]}
          disabled={() => false}
          isLoading={loading}
        />
      )}
    </div>
  </div>
);

export default StudentTableContent; 