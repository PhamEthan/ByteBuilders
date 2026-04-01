import "../css/Calendar.css"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState } from "react";

function Calendar(){

    const [events, setEvents] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedDate, SetselectedDate] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");

    
    const handleSelect = (info) => {
        console.log("Selected: ", info.startStr, info.endStr);

        SetselectedDate({
            start: info.startStr,
            end: info.endStr
        });

        setIsEditing(true);
        setIsPopupOpen(true);
    }

    const saveEvent = () => {
        if (!title.trim()){             //prevent empty spaces, ex: "    " will not be valid
            setError("Title required");
         return;                            //dont allow event w no title to be created
        }
        setError("");

        //resetForm() could cause selectedevent or slecteddate to be null, check
        if (!selectedDate && !selectedEvent) {// at least one must be true to save
            setError("No date or event selected");
            return;
        }

        if (isEditing && selectedEvent) {   //if we selected this event and we're in edit mode
            setEvents((prevEvents) => {             //pass  previous events from state
                return prevEvents.map(event => {        //create new arr of events by looping thru each event, looking for this event
                    if (event.id === selectedEvent.id){     
                        return {                
                            ...event,                   //if found, copy all event properties, replace title and description.... 
                            title:title,                        //....with updated value
                            extendedProps: {
                                description:description
                            }
                        }
                    }

                    return event;                       //if NOT this event, return events in arr w/o modifying, continue
                });
            
            
            })
        }

        else{
            setEvents((prevEvents) => [
            ...prevEvents,          //previous events, add new event to it 
            {
                //TEMP ID CHANGE LATER!!!!!!!!!!!
                id: Date.now().toString(),   

                title: title,
                start: selectedDate.start,
                end: selectedDate.end,
                allDay:false,
                extendedProps: {
                    description: description
                }

            }
            ]);
        }

        
        resetForm();
        setIsPopupOpen(false);
    };

    const deleteEvent = () => {
        if (!selectedEvent){return};

        setEvents((prevEvents) => {
            return prevEvents.filter(event => {
                return event.id !== selectedEvent.id    // if true (not slected event) dont delete, if false delete (match)
            
            }); 
        });

        resetForm();
        setIsPopupOpen(false);

    };

    const handleEventClick = (info) => {
        const event = info.event;

        setSelectedEvent(event);
        setTitle(event.title);
        setDescription(event.extendedProps.description || "");
        setIsEditing(false);
        setIsPopupOpen(true);
        

    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setError("");
        setSelectedEvent(null);
        setIsEditing(false);
        SetselectedDate(null);
    }

    return (
        <div className="calendar-container">
            <FullCalendar
            plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
            initialView={"dayGridMonth"}
            //dateClick={clickDate}
            eventClick={handleEventClick}
            selectable={true}
            select={handleSelect}
            events={events}
            headerToolbar={{
                start:"today prev,next",
                center:"title",
                end:"dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height={'90vh'}
            eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                meridiem:'short'
            }}  
            />
            
            {isPopupOpen ? (
                <div className="modal-overlay" onClick={()=>{
                    setIsPopupOpen(false);
                    resetForm();
                }}>
                    <div className="modal-box" onClick={(event) => event.stopPropagation()}>
                        <button
                            className="modal-close" onClick={()=>{
                                setIsPopupOpen(false);
                                resetForm();
                            }}
                        >X</button>
                        <h2>
                            {
                            selectedEvent ? (isEditing ? "Edit Event": "Event Details")
                            : "Create Event"
                            }
                        </h2>
                        <form
                            className="modal-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (selectedEvent && !isEditing){
                                    setIsEditing(true);
                                    return;
                                }
                                saveEvent();
                            }}
                        >
                            <div className="form-section">
                                <label htmlFor="event-title">Event Title *</label>
                                <input 
                                    id="event-title"
                                    type="text"
                                    
                                    value ={title}
                    
                                    disabled={!isEditing && selectedEvent} 
                                    onChange={ (event) => setTitle(event.target.value)}
                                    required
                                    maxLength={100}
                                />
                                {error ? <p className="error-txt">{error}</p>: null}
                            </div>

                            <div className="form-section">
                                <label htmlFor="event-description">Event Description</label>
                                <textarea 
                                    id="event-description"
                                    rows={5}
                                    disabled={!isEditing && selectedEvent}
                                    
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                />
                            </div>
 
                            <div className="calendar-modal-btns">
                                <button
                                    type="submit"
                                    className="hero-btn primary"
                                >
                                    {selectedEvent ? (isEditing ? "Update" : "Edit")
                                        : "Save"
                                    }
                                </button>

                                {selectedEvent && isEditing ? (
                                    <button 
                                        type="button"
                                        className="hero-btn secondary"
                                        onClick={deleteEvent}
                                    >Delete
                                    </button>
                                ): null}

                                <button
                                    type="button"
                                    className="hero-btn secondary"
                                    onClick={() => {
                                    setIsPopupOpen(false);
                                    resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>    
                    </div>
                </div>
            ) : null}

        </div>
        
    )
}
export default Calendar;