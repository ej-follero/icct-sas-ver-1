import Announcements from "@/components/Announcements";
import CalendarView from "@/components/CalendarView";
import { calendarEvents } from "@/lib/data";

const StudentPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT: Main Schedule */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">Schedule (Section)</h1>
            <CalendarView mode="work-week" events={calendarEvents} />
          </div>
        </div>
        {/* RIGHT: Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <CalendarView 
              mode="month" 
              events={calendarEvents} 
              showEventCards={true}
              className="h-[600px]"
            />
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <Announcements />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;