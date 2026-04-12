import "../css/Calendar.css"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState } from "react";


const apiBase = 'http://localhost:5003/'

let isAuth;

function Calendar(){

    const [events, setEvents] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedDate, SetselectedDate] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");
    const clickDate = (info) => {
        console.log("date clicked", info.dateStr);
        SetselectedDate(info.dateStr);
        setIsPopupOpen(true);
    };

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

            //Send request to appointmentRoutes to create








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

    authenticate();

    return (

        //Testing code for JWT

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
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>
                            {
                            selectedEvent ? (isEditing ? "Edit Event": "Event Details")
                            : "Create Event"
                            }
                        </h2>
                        <input 
                            type="text"
                            placeholder="Event Title"
                            value ={title}
                    
                            disabled={!isEditing} 
                            onChange={ (event) => setTitle(event.target.value)}
                        />
                        {error ? <p className="error-txt">{error}</p>: null}
                        <textarea 
                            disabled={!isEditing}
                            placeholder="Description..."
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                        
                        <div className="modal-btn">
                            <button
                            onClick={() => {                        
                                if (selectedEvent && !isEditing){   //view mode, switch to edit mode
                                    setIsEditing(true);
                                    return;
                                }

                                saveEvent();        //in create or edit mode, save or update
                            }}
                            >
                                {selectedEvent ? (isEditing ? "Update" : "Edit")
                                    : "Save"
                                }
                            </button>
                            {selectedEvent && isEditing ? 
                                <button onClick={deleteEvent}>Delete</button>
                                : null
                            }
                            <button
                            onClick={() => {
                                setIsPopupOpen(false)
                                resetForm()
                                }}>
                                Cancel
                            </button>
                        </div>
                        
                    </div>
                </div>
            ) : null}

        </div>
        
    )
}



function setIsAuth(value)
{
    isAuth = value;
}



async function authenticate() {
   let res = await fetch(apiBase + 'auth/getEvents', {
        credentials: 'include',
        method: 'GET',
        header: { 'Content-Type' : 'application/json'},
    });
    if(res.ok)
    {

        //Returns the authenticated cookie data as debug data.
        console.log("Logged in as: ", res.json());
        console.log("getting calendar events...");
        setIsAuth(true);


        //From here, we can request the calendar event IDs, for display




    }
}


async function requestAddEvent(employeeID, userID, date, title, description, location)
{


    //TODO: Add an update/delete function for the events, using the associated frontend functions
    //TODO: Link and test this with the google calendar API.
    //TODO: Test using actual user Accounts.

    try {
        let res = await fetch('/appointments/book/:eventId', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({employee: employeeID, client: userID, date: date, title: title, description: description, location: location})
        });
        const data = await res.json().catch(() => ({}))
        if(res.ok)
        {
            let eventID; //= res.body.eventID;
            //get the returned eventID, and make a request to add it to the emmployee and user DB entries.

            let userIDs = [employeeID, userID];
            let res2 = await fetch(apiBase + 'auth/addEventUsers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIDs: userIDs, eventID: eventID })
            });
            const data = await res.json().catch(() => ({}))
            if(res.ok)
            {

            }
            else
            {
                throw new Error(data.message || 'Failed to add eventID to the given users');
            }

        }
        else
        {
            throw new Error(data.message || 'Failed to add the event to google calendar');
        }


    } catch (err) {
        console.log(err);
    }


}



export default Calendar;
