"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileText, 
  Database,
  Users,
  Calendar,
  School,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";
import ReportGenerator from "@/components/ReportGenerator";

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'attendance' | 'academic' | 'system' | 'user';
  dataType: string;
  estimatedSize: string;
  lastExported?: string;
  exportFormats: ('csv' | 'pdf' | 'excel')[];
}

const exportTemplates: ExportTemplate[] = [
  {
    id: 'student-data',
    name: 'Student Database',
    description: 'Complete student information including personal details, academic records, and contact information',
    icon: <Users className="h-5 w-5" />,
    category: 'user',
    dataType: 'Student Records',
    estimatedSize: '2.5 MB',
    lastExported: '2024-01-14',
    exportFormats: ['csv', 'excel', 'pdf']
  },
  {
    id: 'attendance-records',
    name: 'Attendance Records',
    description: 'Comprehensive attendance data for all students across all subjects and time periods',
    icon: <Clock className="h-5 w-5" />,
    category: 'attendance',
    dataType: 'Attendance Data',
    estimatedSize: '15.2 MB',
    lastExported: '2024-01-15',
    exportFormats: ['csv', 'excel']
  },
  {
    id: 'academic-structure',
    name: 'Academic Structure',
    description: 'Department, course, subject, and section information with relationships',
    icon: <School className="h-5 w-5" />,
    category: 'academic',
    dataType: 'Academic Data',
    estimatedSize: '0.8 MB',
    lastExported: '2024-01-10',
    exportFormats: ['csv', 'excel', 'pdf']
  },
  {
    id: 'rfid-logs',
    name: 'RFID Access Logs',
    description: 'Complete RFID tag access records with timestamps and location data',
    icon: <Activity className="h-5 w-5" />,
    category: 'system',
    dataType: 'System Logs',
    estimatedSize: '8.7 MB',
    lastExported: '2024-01-15',
    exportFormats: ['csv', 'excel']
  },
  {
    id: 'instructor-data',
    name: 'Instructor Database',
    description: 'Instructor profiles, assignments, and performance metrics',
    icon: <Users className="h-5 w-5" />,
    category: 'user',
    dataType: 'Instructor Records',
    estimatedSize: '1.2 MB',
    lastExported: '2024-01-12',
    exportFormats: ['csv', 'excel', 'pdf']
  },
  {
    id: 'system-logs',
    name: 'System Activity Logs',
    description: 'System events, user actions, and error logs for troubleshooting',
    icon: <Database className="h-5 w-5" />,
    category: 'system',
    dataType: 'System Data',
    estimatedSize: '5.3 MB',
    lastExported: '2024-01-15',
    exportFormats: ['csv', 'pdf']
  }
];

const categories = [
  { id: 'all', label: 'All Data', icon: <Database className="h-4 w-4" /> },
  { id: 'attendance', label: 'Attendance', icon: <Clock className="h-4 w-4" /> },
  { id: 'academic', label: 'Academic', icon: <School className="h-4 w-4" /> },
  { id: 'system', label: 'System', icon: <Activity className="h-4 w-4" /> },
  { id: 'user', label: 'Users', icon: <Users className="h-4 w-4" /> }
];

export default function ExportDataPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);

  const filteredTemplates = exportTemplates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const handleExport = async (template: ExportTemplate, format: string) => {
    console.log(`Exporting ${template.name} in ${format} format`);
    // Here you would implement the actual export logic
    alert(`Exporting ${template.name} in ${format} format...`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Export</h1>
          <p className="text-gray-600 mt-1">Export system data in various formats for analysis and backup</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Database className="w-3 h-3 mr-1" />
            Database Connected
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold text-blue-800">{exportTemplates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Data Size</p>
                <p className="text-2xl font-bold text-green-800">33.7 MB</p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Export</p>
                <p className="text-2xl font-bold text-purple-800">Today</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Export Formats</p>
                <p className="text-2xl font-bold text-orange-800">3</p>
              </div>
              <Download className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              {category.icon}
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {template.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600">{template.dataType}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700">{template.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{template.estimatedSize}</span>
                    </div>
                    
                    {template.lastExported && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Export:</span>
                        <span className="font-medium">{template.lastExported}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Export Formats:</p>
                      <div className="flex gap-2">
                        {template.exportFormats.map(format => (
                          <Button
                            key={format}
                            size="sm"
                            variant="outline"
                            onClick={() => handleExport(template, format)}
                            className="text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {format.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Bulk Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bulk Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => alert('Exporting all data...')}
            >
              <Database className="h-6 w-6" />
              <span>Export All Data</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => alert('Scheduling backup...')}
            >
              <Calendar className="h-6 w-6" />
              <span>Schedule Backup</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => alert('Opening settings...')}
            >
              <Settings className="h-6 w-6" />
              <span>Export Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 