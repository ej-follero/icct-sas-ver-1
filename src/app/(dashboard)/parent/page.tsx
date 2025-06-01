import CalendarView from "@/components/CalendarView";
import { calendarEvents } from "@/lib/data";

const ParentPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">Schedule</h1>
        <CalendarView mode="work-week" events={calendarEvents} />
      </div>
    </div>
  );
};

export default ParentPage;
