import React from 'react';
import StudentDetailModal from '../../components/StudentDetailModal';
import { ConfirmDeleteDialog } from '../../components/ConfirmDeleteDialog';
import { BulkActionsDialog } from '../../components/BulkActionsDialog';
import { EnhancedNotificationSystem } from '../../components/EnhancedNotificationSystem';
import { ExportDialog } from '../../components/ExportDialog';
import { Button } from '../../components/ui/button';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Dispatch, SetStateAction } from 'react';

// You may want to import StudentAttendance type if available
// import { StudentAttendance } from '...';

type StudentAttendance = any; // Replace with actual type if available

interface StudentDialogsProps {
  // Student Detail Modal
  selectedStudent: any;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (open: boolean) => void;
  handleStudentUpdate: (studentId: string, updates: Partial<StudentAttendance>) => void;
  handleSendNotification: (studentId: string, type: string, message: string) => void;

  // Delete Confirmation Dialog
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  studentToDelete: any;
  handleDeleteStudent: () => void;
  isDeletingStudent: boolean;

  // Bulk Delete Confirmation Dialog
  bulkDeleteDialogOpen: boolean;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  selectedIds: string[];
  handleBulkDeleteStudents: () => void;
  isBulkDeleting: boolean;

  // Bulk Actions Dialog
  bulkActionsDialogOpen: boolean;
  setBulkActionsDialogOpen: (open: boolean) => void;
  selectedStudentsForBulkAction: any[];
  handleBulkActionComplete: (actionType: string, results: any) => void;

  // Enhanced Notification System
  systemView: string;
  filteredStudents: any[];
  toast: any;

  // Undo Notifications
  recentlyDeletedStudents: any[];
  handleUndoDelete: (id: string) => void;

  // Custom Date Range Picker Dialog
  showCustomDatePicker: boolean;
  setShowCustomDatePicker: (open: boolean) => void;
  customDateRange: { start: Date; end: Date };
  setCustomDateRange: (range: { start: Date; end: Date }) => void;

  // User Customization Dialog
  showCustomizationDialog: boolean;
  setShowCustomizationDialog: (open: boolean) => void;
  userPreferences: any;
  setUserPreferences: (prefs: any) => void;
  savedCustomizations: any[];
  loadUserCustomization: (customization: any) => void;
  deleteUserCustomization: (id: string) => void;
  saveUserCustomization: (name: string) => void;

  // Export Dialog
  exportDialogOpen: boolean;
  setExportDialogOpen: (open: boolean) => void;
  exportColumns: any[];
  setExportColumns: (cols: any[]) => void;
  exportFormat: 'csv' | 'excel' | 'pdf' | null;
  setExportFormat: (format: 'csv' | 'excel' | 'pdf' | null) => void;
  handleExportCSV: () => void;
  handleExportPDF: () => void;
}

const StudentDialogs: React.FC<StudentDialogsProps> = ({
  selectedStudent,
  isDetailModalOpen,
  setIsDetailModalOpen,
  handleStudentUpdate,
  handleSendNotification,
  deleteDialogOpen,
  setDeleteDialogOpen,
  studentToDelete,
  handleDeleteStudent,
  isDeletingStudent,
  bulkDeleteDialogOpen,
  setBulkDeleteDialogOpen,
  selectedIds,
  handleBulkDeleteStudents,
  isBulkDeleting,
  bulkActionsDialogOpen,
  setBulkActionsDialogOpen,
  selectedStudentsForBulkAction,
  handleBulkActionComplete,
  systemView,
  filteredStudents,
  toast,
  recentlyDeletedStudents,
  handleUndoDelete,
  showCustomDatePicker,
  setShowCustomDatePicker,
  customDateRange,
  setCustomDateRange,
  showCustomizationDialog,
  setShowCustomizationDialog,
  userPreferences,
  setUserPreferences,
  savedCustomizations,
  loadUserCustomization,
  deleteUserCustomization,
  saveUserCustomization,
  exportDialogOpen,
  setExportDialogOpen,
  exportColumns,
  setExportColumns,
  exportFormat,
  setExportFormat,
  handleExportCSV,
  handleExportPDF,
}) => (
  <>
    {/* Student Detail Modal */}
    <StudentDetailModal
      student={selectedStudent}
      isOpen={isDetailModalOpen}
      onClose={() => setIsDetailModalOpen(false)}
      onUpdate={(studentId: string, updates: Partial<StudentAttendance>) => handleStudentUpdate(studentId, updates)}
      onSendNotification={(studentId: string, type: string, message: string) => handleSendNotification(studentId, type, message)}
    />

    {/* Delete Confirmation Dialog */}
    <ConfirmDeleteDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      itemName={studentToDelete?.studentName}
      description={`Are you sure you want to delete "${studentToDelete?.studentName}"? This action will mark the student as inactive and cannot be undone.`}
      onDelete={handleDeleteStudent}
      canDelete={!!studentToDelete}
      deleteError={null}
      loading={isDeletingStudent}
    />

    {/* Bulk Delete Confirmation Dialog */}
    <ConfirmDeleteDialog
      open={bulkDeleteDialogOpen}
      onOpenChange={setBulkDeleteDialogOpen}
      itemName={`${selectedIds.length} selected student${selectedIds.length !== 1 ? 's' : ''}`}
      description={`Are you sure you want to delete ${selectedIds.length} selected student${selectedIds.length !== 1 ? 's' : ''}? This action will mark them as inactive and cannot be undone.`}
      onDelete={handleBulkDeleteStudents}
      canDelete={selectedIds.length > 0}
      deleteError={null}
      loading={isBulkDeleting}
    />

    {/* Enhanced Bulk Actions Dialog */}
    <BulkActionsDialog
      open={bulkActionsDialogOpen}
      onOpenChange={setBulkActionsDialogOpen}
      selectedStudents={selectedStudentsForBulkAction}
      onActionComplete={(actionType: string, results: any) => handleBulkActionComplete(actionType, results)}
      onCancel={() => setBulkActionsDialogOpen(false)}
    />

    {/* Enhanced Notification System */}
    {systemView === 'notifications' && (
      <EnhancedNotificationSystem
        students={filteredStudents}
        onSendNotification={async (notification: any) => {
          if (notification && notification.studentId && notification.type && notification.message) {
            handleSendNotification(notification.studentId, notification.type, notification.message);
          }
        }}
        onSaveTemplate={async (template: any) => {
          toast.success('Template saved successfully');
        }}
        onDeleteTemplate={async (templateId: any) => {
          toast.success('Template deleted successfully');
        }}
        onScheduleCampaign={async (campaign: any) => {
          toast.success('Campaign scheduled successfully');
        }}
      />
    )}

    {/* Undo Notifications */}
    {recentlyDeletedStudents.map((deletedStudent, index) => {
      const timeLeft = Math.max(0, 5 * 60 * 1000 - (Date.now() - deletedStudent.deletedAt.getTime()));
      const minutesLeft = Math.floor(timeLeft / 60000);
      const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
      return (
        <div
          key={deletedStudent.id}
          className="fixed bottom-4 right-4 z-50 bg-white border border-red-200 rounded-xl shadow-lg p-4 max-w-sm animate-fade-in"
          style={{ 
            bottom: `${4 + (index * 5)}rem`,
            right: '1rem'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-600">
                STUDENT DELETED
              </p>
              <p className="text-sm text-red-600 mt-1">
                &quot;{deletedStudent.name}&quot; has been marked as inactive
              </p>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Undo available for {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                onClick={() => handleUndoDelete(deletedStudent.id)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Undo
              </Button>
            </div>
          </div>
        </div>
      );
    })}

    {/* Custom Date Range Picker Dialog */}
    <Dialog open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Custom Date Range</DialogTitle>
          <DialogDescription>
            Choose a custom date range for trend analysis
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={customDateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: new Date(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={customDateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: new Date(e.target.value) })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCustomDatePicker(false)}>
            Cancel
          </Button>
          <Button onClick={() => setShowCustomDatePicker(false)}>
            Apply Range
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* User Customization Dialog */}
    <Dialog open={showCustomizationDialog} onOpenChange={setShowCustomizationDialog}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Configure your dashboard preferences and save custom layouts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Default Settings */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Default Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Default Time Range</label>
                <Select value={userPreferences.defaultTimeRange} onValueChange={(value: any) => setUserPreferences({ ...userPreferences, defaultTimeRange: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Chart Layout</label>
                <Select value={userPreferences.chartLayout} onValueChange={(value: any) => setUserPreferences({ ...userPreferences, chartLayout: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Color Scheme</label>
                <Select value={userPreferences.colorScheme} onValueChange={(value: any) => setUserPreferences({ ...userPreferences, colorScheme: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Data Density</label>
                <Select value={userPreferences.dataDensity} onValueChange={(value: any) => setUserPreferences({ ...userPreferences, dataDensity: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Chart Options */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Chart Options</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showConfidenceIntervals"
                  checked={userPreferences.showConfidenceIntervals}
                  onCheckedChange={(checked: boolean) => setUserPreferences({ ...userPreferences, showConfidenceIntervals: !!checked })}
                />
                <label htmlFor="showConfidenceIntervals" className="text-sm text-gray-700">
                  Show confidence intervals in forecasts
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showTrendLines"
                  checked={userPreferences.showTrendLines}
                  onCheckedChange={(checked: boolean) => setUserPreferences({ ...userPreferences, showTrendLines: !!checked })}
                />
                <label htmlFor="showTrendLines" className="text-sm text-gray-700">
                  Show trend lines on charts
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoRefresh"
                  checked={userPreferences.autoRefresh}
                  onCheckedChange={(checked: boolean) => setUserPreferences({ ...userPreferences, autoRefresh: !!checked })}
                />
                <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                  Auto-refresh data every 5 minutes
                </label>
              </div>
            </div>
          </div>

          {/* Saved Customizations */}
          {savedCustomizations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Saved Customizations</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {savedCustomizations.map((customization) => (
                  <div key={customization.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customization.name}</p>
                      <p className="text-xs text-gray-500">
                        {customization.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadUserCustomization(customization)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteUserCustomization(customization.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCustomizationDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const name = prompt('Enter a name for this customization:');
              if (name) {
                saveUserCustomization(name);
              }
            }}
          >
            Save Customization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Export Dialog */}
    <ExportDialog
      open={exportDialogOpen}
      onOpenChange={setExportDialogOpen}
      exportableColumns={[
        { key: 'studentName', label: 'Student Name' },
        { key: 'studentId', label: 'Student ID' },
        { key: 'department', label: 'Department' },
        { key: 'course', label: 'Course' },
        { key: 'yearLevel', label: 'Year Level' },
        { key: 'attendanceRate', label: 'Attendance Rate' },
        { key: 'status', label: 'Status' },
        { key: 'presentDays', label: 'Present Days' },
        { key: 'absentDays', label: 'Absent Days' },
        { key: 'totalDays', label: 'Total Days' }
      ]}
      exportColumns={exportColumns}
      setExportColumns={setExportColumns}
      exportFormat={exportFormat}
      setExportFormat={setExportFormat}
      onExport={() => {
        if (exportFormat === 'csv') {
          handleExportCSV();
        } else if (exportFormat === 'pdf') {
          handleExportPDF();
        } else if (exportFormat === 'excel') {
          handleExportCSV(); // For now, use CSV export for Excel format
        }
        setExportDialogOpen(false);
      }}
      title="Export Student Attendance Data"
      tooltip="Export the current student attendance data with selected columns and format."
    />
  </>
);

export default StudentDialogs; 