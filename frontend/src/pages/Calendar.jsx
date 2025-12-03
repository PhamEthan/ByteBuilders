import "../css/Calendar.css"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function Calendar(){
    return (
        <div>
            <FullCalendar
            plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
            initialView={"dayGridMonth"}
            headerToolbar={{
                start:"today prev,next",
                center:"title",
                end:"dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height={'90vh'}  
            />
        </div>

    )
}
export default Calendar;