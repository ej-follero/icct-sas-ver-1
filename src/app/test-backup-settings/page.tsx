"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import BackupSettingsDialog from "@/components/reusable/Dialogs/BackupSettingsDialog";

export default function TestBackupSettingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Backup Settings Test Page
          </h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates the fully functional BackupSettingsDialog component.
            The dialog integrates with a real API endpoint and database.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-800 mb-2">Features:</h2>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Loads existing settings from database when opened</li>
                <li>• Saves settings to database via API</li>
                <li>• Form validation and error handling</li>
                <li>• Loading states and user feedback</li>
                <li>• Responsive design with modern UI</li>
              </ul>
            </div>
            
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Open Backup Settings Dialog
            </Button>
          </div>
        </div>
      </div>

      <BackupSettingsDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  );
} 