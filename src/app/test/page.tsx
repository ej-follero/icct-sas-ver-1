'use client'

import { useMQTTClient } from '@/components/MQTTprovider';
import { Student } from '@prisma/client';
import React, { useEffect, useState } from 'react'


const cards = ['7F9821F2', '73692F2', 'BF2E16FA', 'F37A342']

const students : Partial<Student>[]= cards.map((card, index) => ({
  studentId: index + 1,
  studentIdNum: '1234567890' + index,
  firstName: 'Student ' + index,
  lastName: 'Doe',
  rfidTag: card,
}))


export default function TestPage() {

    const { status, mode , messages, cardId} = useMQTTClient();

    const [attendanceRecords, setAttendanceRecords] = useState<Partial<Student>[]>([]);
  
    const lastMessage = messages[messages.length - 1];
  
    const newAttendance = students.find(student => student.rfidTag === lastMessage?.rfid);
  
    console.log(newAttendance);
  
    useEffect(() => {
      if (newAttendance) {

        setAttendanceRecords(current => current.some(c => c.studentId === newAttendance.studentId) ? current : [...current, newAttendance]);
      }
    }, [newAttendance]);

    useEffect(() => {
      if (cardId) {
        students.push({
          studentId: students.length + 1,
          studentIdNum: cardId,
          firstName: 'Student ' + students.length + 1,
          lastName: 'Doe',
          rfidTag: cardId,
        });
      }
    }, [cardId]);

    
  return (
    <div>
        {status === "connected" ?  <p>Connected</p> : <p>Disconnected</p>}
        {mode === "attendance" ?  <p>Attendance</p> : <p>Registration {cardId}</p>}
      <h1>Test Page</h1>

      <table className="w-full text-black" style={{ color: 'black' }}>
        <thead>
          <tr>
            <th>Student</th>
            <th>RFID Tag</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attendanceRecords.map((student) => (
            <tr key={student.studentId}>
              <td>{student.firstName} {student.lastName}</td>
              <td>{student.rfidTag}</td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
