"use client";
import React, { useState, useEffect } from 'react';
import BatchAssign from '@/components/rfid/BatchAssign';
import { Card, CardHeader } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useMQTTClient } from '@/components/MQTTprovider';
import { Student, User } from '@prisma/client';
import { TableHead, TableHeader, TableRow, Table, TableBody, TableCell } from '@/components/ui/table';

type StudentRow = {
  studentId: number;
  studentIdNum: string;
  name: string;
  currentTag?: string | null;
};


export default function AssignBatchRFIDPage() {

 
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      

      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full">
          <CardHeader className="p-0">
            <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
              <div className="py-4 sm:py-6">
                <div className="flex items-center gap-3 px-4 sm:px-6">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Batch-Scan Assign</h3>
                    <p className="text-blue-100 text-sm">Assign RFID cards to students with live scanning</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <div className="p-4 sm:p-6">
            <BatchAssign isFullscreen onAssigned={() => { /* optional: summary handling */ }} />
          </div>
        </Card>
      </div>



    </div>
  );
}


