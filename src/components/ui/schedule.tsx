'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, Loader2, RefreshCw, User, GraduationCap, AlertCircle } from 'lucide-react';

type Status = 'ACTIVE'|'INACTIVE'|'CANCELLED';
type DayEnum = 'MONDAY'|'TUESDAY'|'WEDNESDAY'|'THURSDAY'|'FRIDAY'|'SATURDAY'|'SUNDAY';

interface RelSubject   { subjectId:number; subjectName:string; subjectCode:string; }
interface RelSection   { sectionId:number; sectionName:string; }
interface RelInstructor{ instructorId:number; firstName:string; lastName:string; }
interface RelRoom      { roomId:number; roomName:string; building?:string|null; }
interface RelSemester  { semesterId:number; semesterName:string; }

export interface SubjectSchedule {
  subjectSchedId: number;
  subjectId: number;
  sectionId: number;
  instructorId: number;
  roomId: number;
  day: DayEnum;
  startTime: string; // "08:00"
  endTime:   string; // "10:00"
  slots: number;
  scheduleType: string;
  status: Status;
  semesterId: number;
  academicYear: string;
  isRecurring: boolean;
  startDate?: string|null;
  endDate?: string|null;
  maxStudents: number;
  currentEnrollment: number;
  notes?: string|null;
  createdAt: string;
  updatedAt: string;
  subject:   RelSubject;
  section:   RelSection;
  instructor:RelInstructor;
  room:      RelRoom;
  semester:  RelSemester;
}

interface Props { instructorId?: number } // optional: will also accept ?instructorId= in URL

const WEEK_ENUM: DayEnum[] = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'];
const WEEK_LABEL           = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

const to12h = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t;
  let h = Number(m[1]); const min = m[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
};
const trange = (s: string, e: string) => `${to12h(s)} - ${to12h(e)}`;

export default function Schedule({ instructorId }: Props) {
  const search = useSearchParams();
  const idFromUrl = Number(search.get('instructorId'));
  const effectiveId =
    (typeof instructorId === 'number' && !Number.isNaN(instructorId) && instructorId) ||
    (!Number.isNaN(idFromUrl) && idFromUrl) ||
    null;

  const [data, setData] = useState<SubjectSchedule[]>([]);
  const [loading,setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [refreshing,setRefreshing] = useState(false);

  const load = async (refresh=false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const res = await fetch(`/api/schedules?instructorId=${effectiveId}`, { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const j: SubjectSchedule[] = await res.json();
      setData(j.filter(s => s.status === 'ACTIVE'));
      setError(null);
    } catch (e:any) {
      setError(e.message ?? 'Failed to fetch schedules');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => {
    if (effectiveId) load();
    else { setError('Instructor ID is required'); setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveId]);

  const timeSlots = useMemo(() => {
    const set = new Set<string>();
    data.forEach(s => set.add(trange(s.startTime,s.endTime)));
    return [...set].sort((a,b) => a.localeCompare(b));
  }, [data]);

  const dayIdx = new Date().getDay();
  const todayEnum: DayEnum = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][dayIdx] as DayEnum;
  const todayLabel = new Date().toLocaleDateString('en-US',{ weekday:'long' });
  const todays = data.filter(s => s.day === todayEnum);

  const statusPill = (st: Status) =>
    st === 'ACTIVE'   ? 'bg-green-100 text-green-800'
  : st === 'CANCELLED'? 'bg-red-100 text-red-800'
  :                    'bg-gray-100 text-gray-800';

  const enrollColor = (c:number,m:number) => {
    const p = (c/m)*100;
    return p>=90 ? 'text-red-600' : p>=75 ? 'text-orange-600' : 'text-green-600';
  };

  if (!effectiveId) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Instructor required</h3>
            <p className="text-gray-600">
              Pass <code>instructorId</code> as a prop or add <code>?instructorId=ID</code> to the URL.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={() => load()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Teaching Schedule</h1>
            <p className="text-gray-600">View your assigned classes and teaching schedule</p>
            {data[0] && (
              <p className="text-sm text-gray-500 mt-1">
                Academic Year: {data[0].academicYear} | Semester: {data[0].semester.semesterName}
              </p>
            )}
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {data.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Schedule Found</h3>
            <p className="text-gray-600">You don't have any active classes scheduled at the moment.</p>
          </div>
        ) : (
          <>
            {/* Weekly grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Weekly Schedule</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Time</th>
                      {WEEK_LABEL.map((d) => (
                        <th key={d} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeSlots.map((slot) => (
                      <tr key={slot}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">{slot}</td>
                        {WEEK_ENUM.map((day) => {
                          const cls = data.find(s => s.day === day && trange(s.startTime,s.endTime) === slot);
                          return (
                            <td key={`${day}-${slot}`} className="px-6 py-4 text-sm text-gray-500">
                              {cls ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100">
                                  <div className="font-semibold text-blue-900 mb-2">
                                    {cls.subject.subjectCode} — {cls.subject.subjectName}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center text-blue-700">
                                      <MapPin className="w-3 h-3 mr-1" />
                                      <span className="text-xs">
                                        {cls.room.building ? `${cls.room.building} - ` : ''}{cls.room.roomName}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-blue-700">
                                      <Users className="w-3 h-3 mr-1" />
                                      <span className="text-xs">{cls.section.sectionName}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <GraduationCap className="w-3 h-3 mr-1" />
                                      <span className={`text-xs ${enrollColor(cls.currentEnrollment, cls.maxStudents)}`}>
                                        {cls.currentEnrollment}/{cls.maxStudents}
                                      </span>
                                    </div>
                                    {!!cls.slots && (
                                      <div className="flex items-center text-blue-700">
                                        <Clock className="w-3 h-3 mr-1" />
                                        <span className="text-xs">{cls.slots} slots</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    {cls.scheduleType !== 'REGULAR' && (
                                      <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">{cls.scheduleType}</span>
                                    )}
                                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${statusPill(cls.status)}`}>{cls.status}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-300 text-center py-6">—</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Today */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Today’s Classes ({todayLabel})</h2>
              </div>
              <div className="p-6">
                {todays.length ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {todays.map(item => (
                      <div key={item.subjectSchedId} className="border border-green-200 rounded-lg p-4 bg-green-50 hover:shadow-md">
                        <h3 className="font-semibold text-green-900 mb-3">
                          {item.subject.subjectCode} — {item.subject.subjectName}
                        </h3>
                        <div className="space-y-2 text-sm text-green-700">
                          <div className="flex items-center"><Clock className="w-4 h-4 mr-2"/><span>{trange(item.startTime,item.endTime)}</span></div>
                          <div className="flex items-center"><MapPin className="w-4 h-4 mr-2"/><span>{item.room.building ? `${item.room.building} - `:''}{item.room.roomName}</span></div>
                          <div className="flex items-center"><Users className="w-4 h-4 mr-2"/><span>{item.section.sectionName}</span></div>
                          <div className="flex items-center"><GraduationCap className="w-4 h-4 mr-2"/><span className={enrollColor(item.currentEnrollment,item.maxStudents)}>{item.currentEnrollment}/{item.maxStudents} students</span></div>
                          <div className="flex items-center"><User className="w-4 h-4 mr-2"/><span>{item.instructor.firstName} {item.instructor.lastName}</span></div>
                          {!!item.slots && (<div className="flex items-center"><Clock className="w-4 h-4 mr-2"/><span>{item.slots} slots</span></div>)}
                          {item.notes && (<div className="flex items-start"><AlertCircle className="w-4 h-4 mr-2 mt-0.5"/><span className="text-xs">{item.notes}</span></div>)}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {item.scheduleType !== 'REGULAR' && (<span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">{item.scheduleType}</span>)}
                          <span className={`inline-block text-xs px-2 py-1 rounded-full ${statusPill(item.status)}`}>{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No classes scheduled for today</p>
                    <p className="text-gray-400 text-sm mt-2">Enjoy your free day!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Schedule Summary</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{data.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Classes</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{todays.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Today’s Classes</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{new Set(data.map(s => s.subject.subjectName)).size}</div>
                  <div className="text-sm text-gray-600 mt-1">Different Subjects</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{data.reduce((sum,s)=>sum+s.currentEnrollment,0)}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Students</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
