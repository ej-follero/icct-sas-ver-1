import CalendarView from "@/components/CalendarView";
import { calendarEvents } from "@/lib/data";

const TeacherPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Schedule</h1>
            <CalendarView mode="work-week" events={calendarEvents} />
      </div>
    </div>
  );
};

export default TeacherPage;
