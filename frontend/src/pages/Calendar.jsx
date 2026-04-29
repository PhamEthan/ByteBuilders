import "../css/Calendar.css"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState } from "react";


const apiBase = 'https://becausewecare.onrender.com/'

const hours = [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const minutes = [ "00", "05", "10", "15","20", "25","30", "35","40", "45","50", "55"];
const AMPM = ["PM", "AM"];

function Calendar(){

    const [events, setEvents] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedDate, SetselectedDate] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [eventID, setEventID] = useState("");
    const [eventEmployee, setEventEmployee] = useState("");
    const [eventUser, setEventUser] = useState("");

    const [eventStartHour, setEventStartHour] = useState("");
    const [eventStartMinute, setEventStartMinute] = useState("");
    const [eventStartAMPM, setEventStartAMPM] = useState("");

    const [eventEndHour, setEventEndHour] = useState("");
    const [eventEndMinute, setEventEndMinute] = useState("");
    const [eventEndAMPM, setEventEndAMPM] = useState("");
    const [checkInStatus, setCheckInStatus] = useState("No Check In yet.");


    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [patientName, setPatientName] = useState("");
    const [caregiverName, setCaregiverName] = useState("");

    const [eventsList, setEventsList] = useState([]);

    const [employees, setEmployees] = useState([]);
    const [users, setUsers] = useState([]);
    const [role, setRole] = useState(null);
    const [curUserID, setCurUserID] = useState("");
    const [curUserName, setCurUserName] = useState("");
    const [isAuth, setIsAuth] = useState(false);
    const [eventsFulfilled, setEventsFulfilled] = useState(false);

    //const { users, userStates, updateUserState } = useContext(UserContext);
    const [address, setAddress] = useState("");
    const [message, setMessage] = useState("");
    const [checkInUser, setCheckInUser] = useState("");
    const [checkInTime, setCheckInTime] = useState("");



    const [error, setError] = useState("");


    /*
    const clickDate = (info) => {
        console.log("date clicked", info.dateStr);
        SetselectedDate(info.dateStr);
        setIsPopupOpen(true);
    };
    */







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
        var requestMade = false;
        if (isEditing && selectedEvent) {   //if we selected this event and we're in edit mode
            setEvents((prevEvents) => {             //pass  previous events from state
                return prevEvents.map(event => {        //create new arr of events by looping thru each event, looking for this event
                    if (event.id === selectedEvent.id){
                        //TODO: If the event is found, we send a request to appointmentRoutes to update the event.




                    if(requestMade === false)
                    {
                        (async () => {

                            // Caregiver / Patient variables:
                            var curPatient = event.extendedProps.patient;
                            var curCaregiver = event.extendedProps.caregiver;
                            var newPatient = patientName;
                            var newCaregiver = caregiverName;





                            //All other event attributes:
                            var newDescription = newCaregiver + "-" + newPatient + "=" + description;
                            newDescription = newDescription.toString();




                            var formattedStart = new Date(selectedEvent.end);
                            var modifiedStart = parseInt(eventStartHour);
                            if(eventStartAMPM === "PM")
                            {
                                //Adjust by 12 hours if in the evening, to account for AM/PM for ISO time conversion
                                modifiedStart += 12;
                            }
                            formattedStart.setHours(modifiedStart);
                            formattedStart.setMinutes(eventStartMinute);

                            var startISO = formattedStart.toISOString();


                            //Time and date Formatting.
                            var formattedEnd = new Date(selectedEvent.end);
                            var modifiedEnd = parseInt(eventEndHour);
                            if(eventEndAMPM === "PM")
                            {
                                //Adjust by 12 hours if in the evening, to account for AM/PM for ISO time conversion
                                modifiedEnd += 12;
                            }

                            //If the event starts on one day, and ends the next day, the date rolls over to the next day.
                            if(eventStartAMPM === "PM" && eventEndAMPM === "AM")
                            {
                                formattedEnd.setDate(formattedEnd.getDate() + 1);
                            }

                            formattedEnd.setHours(modifiedEnd);
                            formattedEnd.setMinutes(eventEndMinute);

                            var endISO = formattedEnd.toISOString();

                            console.log("Selected Start Time: ", formattedStart);
                            console.log("Selected End Time: ", formattedEnd);

                            setStartTime(startISO);
                            setEndTime(endISO);




                            // Update request
                            requestUpdateEvent(curCaregiver, curPatient, newCaregiver, newPatient, title,  location, newDescription, startISO, endISO, event.id);

                            var filledEvents = events;
                            console.log("Filled Events1: ",filledEvents);


                            var start = startISO.dateTime;
                            var end = endISO.dateTime;

                            filledEvents.push({
                                id: event.id,
                                title: title,
                                start: start,
                                end: end,
                                allDay:false,
                                extendedProps: {
                                    location: location,
                                    description: newDescription,
                                    caregiver: newCaregiver,
                                    patient: newPatient,
                                }

                            });
                            setEvents(filledEvents);
                            console.log("Filled Events2: ",filledEvents);

                            requestMade = true;
                        })()





                    }



                    }

                    return event;                       //if NOT this event, return events in arr w/o modifying, continue
                });
            
            
            })









        }

        else{
            //If the event didnt already exist, we send a request to appointment routes to create a new event, and return the entirety of the event's created info, so that it can be passed in below when creating our event object.
            //This is so that they can share the same data, and so that our event object can have the eventID tied to it, in case we go in and edit/delete/update any data.


            // Time formatting and calculations.
            //Formatting into ISO Standard

            // Add 5 hours to line up with UTC

            var formattedStart = new Date(selectedDate.end);
            var modifiedStart = parseInt(eventStartHour);
            if(eventStartAMPM === "PM")
            {
                //Adjust by 12 hours if in the evening, to account for AM/PM for ISO time conversion
                modifiedStart += 12;
            }
            formattedStart.setHours(modifiedStart);
            formattedStart.setMinutes(eventStartMinute);

            var startISO = formattedStart.toISOString();



            var formattedEnd = new Date(selectedDate.end);
            var modifiedEnd = parseInt(eventEndHour);
            if(eventEndAMPM === "PM")
            {
                //Adjust by 12 hours if in the evening, to account for AM/PM for ISO time conversion
                modifiedEnd += 12;
            }

            //If the event starts on one day, and ends the next day, the date rolls over to the next day.
            if(eventStartAMPM === "PM" && eventEndAMPM === "AM")
            {
                formattedEnd.setDate(formattedEnd.getDate() + 1);
            }

            formattedEnd.setHours(modifiedEnd);
            formattedEnd.setMinutes(eventEndMinute);

            var endISO = formattedEnd.toISOString();

            console.log("Selected Start Time: ", formattedStart);
            console.log("Selected End Time: ", formattedEnd);

            setStartTime(startISO);
            setEndTime(endISO);

            var start = startISO.dateTime;
            var end = endISO.dateTime;


            (async () => {
                var comboDescription = caregiverName + "-" + patientName + "=" + description;
                comboDescription = comboDescription.toString();
                console.log(comboDescription);
                var newID = await requestAddEvent(eventEmployee, eventUser, startISO, endISO, title, comboDescription, location, curUserID);



                 var filledEvents = events;
                 console.log("Filled Events1: ",filledEvents);

                 filledEvents.push({
                     id: newID,
                     title: title,
                     start: start,
                     end: end,
                     allDay:false,
                     extendedProps: {
                         location: location,
                         description: comboDescription,
                         caregiver: caregiverName,
                         patient: patientName,
                     }

                 });
                 setEvents(filledEvents);
                 console.log("Filled Events2: ",filledEvents);
                 console.log("events check: ", events);


            })()


        }

        resetForm();
        setIsPopupOpen(false);
    };



    const deleteEvent = () => {
        if (!selectedEvent){return};


        setEvents((prevEvents) => {
            return prevEvents.filter(event => {

                if(event.id === selectedEvent.id)
                {
                    console.log("eventID: ",event.id);
                    console.log("Employee: ", event.extendedProps.caregiver);
                    console.log("Patient: ", event.extendedProps.patient);
                    requestDeleteEvent(event.id, event.extendedProps.caregiver, event.extendedProps.patient, curUserID);
                }
                return event.id !== selectedEvent.id    // if true (not slected event) dont delete, if false delete (match)

            }); 
        });


        resetForm();
        setIsPopupOpen(false);

    };


    //Handles time re-adjustment from ISO time, from UTC to the local timezone, so that it can be input on the event edit page.
    function calculateTime(start, end)
    {
        var startTime = start.toISOString().split("T");
        var startSplit = startTime[1].split(":");

        setEventStartMinute(startSplit[1]);
        var startHour = parseInt(startSplit[0]) - 5;

        //Accounting for times where time zome adjustment causes the hour to be a negative number.
        if(startHour < 0)
        {
            startHour += 12
        }

        //Determining if it's an AM or PM time slot
        if(startHour > 12)
        {
            setEventStartAMPM("PM");
            startHour -= 12;
        }
        else
        {
            setEventStartAMPM("AM");
        }

        //Adjusts to be a string, adding a 0 to the front if its a single digit number.
        if(startHour < 10)
        {
            startHour = "0" + startHour.toString();
        }
        else
        {
            startHour = startHour.toString();
        }
        setEventStartHour(startHour);




        var endTime = end.toISOString().split("T");
        console.log("EndTime: ", endTime);
        var endSplit = endTime[1].split(":");

        setEventEndMinute(endSplit[1]);
        var endHour = parseInt(endSplit[0]) - 5;

        //Accounting for times where time zome adjustment causes the hour to be a negative number.
        if(endHour < 0)
        {
            endHour += 12
        }

        console.log("EndHour: ", endHour);


        //Determining if it's an AM or PM time slot
        if(endHour > 12)
        {
            setEventEndAMPM("PM");
            endHour -= 12;
        }
        else
        {
            setEventEndAMPM("AM");
        }

        //Adjusts to be a string, adding a 0 to the front if its a single digit number.
        if(endHour < 10)
        {
            endHour = "0" + endHour.toString();
        }
        else
        {
            endHour = endHour.toString();
        }

        setEventEndHour(endHour);
    }


    const handleEventClick = (info) => {
        const event = info.event;

        setSelectedEvent(event);
        setTitle(event.title);
        setEventID(event.id);
        console.log(event.id);
        setLocation(event.extendedProps.location);
        setAddress(event.extendedProps.location);
        setDescription(event.extendedProps.description || "");
        calculateTime(event.start, event.end);
        setStartTime(event.start);
        setEndTime(event.end);
        setPatientName(event.extendedProps.patient);
        setCaregiverName(event.extendedProps.caregiver);
        setEventUser(event.extendedProps.patient);
        setEventEmployee(event.extendedProps.caregiver);
        setCheckInStatus(event.extendedProps.checkInStatus);

        setIsEditing(false);
        setIsPopupOpen(true);
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setLocation("");
        //setEventID("");
        setError("");
        setSelectedEvent(null);
        setIsEditing(false);
        SetselectedDate(null);
    }


    function handleEmployeeSelect(e)
    {

        //Recieves the value as a string with a comma. The values are then split.
        //console.log("Selected Employee: ", e.target.value);
        const emplSel = e.target.value.split(",");
        //the first value is the userID, the second value is their name.
        setEventEmployee(emplSel[0]);
        setCaregiverName(emplSel[1]);
    }

    function handleUserSelect(e)
    {

        //console.log("Selected User: ", e.target.value);
        const userSel = e.target.value.split(",");
        setEventUser(userSel[0]);
        setPatientName(userSel[1]);

    }

    function handleHourStartSelect(e)
    {
        console.log("selected hour: ", e.target.value);
        const hourSel = e.target.value;
        setEventStartHour(hourSel);
    }
    function handleMinuteStartSelect(e)
    {
        console.log("selected minute: ", e.target.value);
        const minSel = e.target.value;
        setEventStartMinute(minSel);
    }

    function handleHourEndSelect(e)
    {
        console.log("selected hour: ", e.target.value);
        const hourSel = e.target.value;
        setEventEndHour(hourSel);
    }
    function handleMinuteEndSelect(e)
    {
        console.log("selected minute: ", e.target.value);
        const minSel = e.target.value;
        setEventEndMinute(minSel);
    }

    function handleEventStartAMPM(e)
    {
        console.log("selected AM/PM: ", e.target.value);
        const AMPMSel = e.target.value;
        setEventStartAMPM(AMPMSel);
    }

    function handleEventEndAMPM(e)
    {
        console.log("selected AM/PM: ", e.target.value);
        const AMPMSel = e.target.value;
        setEventEndAMPM(AMPMSel);
    }


    function displayEvents(eventsResponse)
    {

        var filledEvents = [];
        for (const index in eventsResponse)
        {
            var newTitle = eventsResponse[index].summary;
            var newLocation = eventsResponse[index].location;

            var inputDescription = eventsResponse[index].description;
            var employee = inputDescription.split("-");
            var patient = employee[1].split("=");
            var description = patient[1].split("+");

            var employeeName = employee[0];
            var patientName = patient[0];
            var newDescription = description[0];
            var checkInStatus = description[1];

            //var newDescription = eventsResponse[index].description;
            var newEventID = eventsResponse[index].id;


            var start = eventsResponse[index].start.dateTime;
            var end = eventsResponse[index].end.dateTime;

            filledEvents.push({
                id: newEventID,
                title: newTitle,
                start: start,
                end: end,
                allDay:false,
                extendedProps: {
                    location: newLocation,
                    description: newDescription,
                    caregiver: employeeName,
                    patient: patientName,
                    checkInStatus: checkInStatus
                }

            });
            setEvents(filledEvents);

        }
    }





    // Function to calculate distance between two coordinates (Haversine formula)
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // meters
        const toRad = (value) => (value * Math.PI) / 180;

        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δφ = toRad(lat2 - lat1);
        const Δλ = toRad(lon2 - lon1);

        const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) *
        Math.cos(φ2) *
        Math.sin(Δλ / 2) *
        Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // distance in meters
    };

    const handleCheckin = async (addressToCheck, userId) => {
        if (!navigator.geolocation) {
            console.log("Geolocation not supported.")
            setMessage("Geolocation not supported.");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {

            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            try {
                // Convert address to coordinates using OpenStreetMap

                const response = await fetch(apiBase + 'auth/getLocationData', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: address })
                });

                const position = await response.json();
                let data = position.pos;

                if (data.length === 0) {
                    setMessage("Address not found.");
                    //updateUserState(userId, { isVerified: false, isError: false });
                    //triggerErrorFlash(userId);
                    return;
                }

                const targetLat = parseFloat(data[0].lat);
                const targetLon = parseFloat(data[0].lon);

                const distance = getDistance(userLat, userLon, targetLat, targetLon);

                if (distance <= 500) {
                    setMessage("✅ Check-in successful! You are at the location.");

                    let currentTime = new Date();
                    console.log("Check in time: ", currentTime);
                    setCheckInTime(currentTime);
                    console.log(curUserName);
                    setCheckInUser(curUserName);

                    var checkInTimeString = caregiverName + "-" + patientName + "=" + description + "+" + curUserName + " checked in at: " + currentTime.toLocaleString();


                    var formattedStart = new Date(selectedEvent.end);
                    var modifiedStart = parseInt(eventStartHour);
                    if(eventStartAMPM === "PM")
                    {
                        //Adjust by 12 hours if in the evening, to account for AM/PM for ISO time conversion
                        modifiedStart += 12;
                    }
                    formattedStart.setHours(modifiedStart);
                    formattedStart.setMinutes(eventStartMinute);

                    var startISO = formattedStart.toISOString();


                    //Time and date Formatting.
                    var formattedEnd = new Date(selectedEvent.end);
                    var modifiedEnd = parseInt(eventEndHour);
                    if(eventEndAMPM === "PM")
                    {
                        //Adjust by 12 hours if in the evening, to account for AM/PM for ISO time conversion
                        modifiedEnd += 12;
                    }

                    //If the event starts on one day, and ends the next day, the date rolls over to the next day.
                    if(eventStartAMPM === "PM" && eventEndAMPM === "AM")
                    {
                        formattedEnd.setDate(formattedEnd.getDate() + 1);
                    }

                    formattedEnd.setHours(modifiedEnd);
                    formattedEnd.setMinutes(eventEndMinute);

                    var endISO = formattedEnd.toISOString();

                    console.log("Selected Start Time: ", formattedStart);
                    console.log("Selected End Time: ", formattedEnd);

                    setStartTime(startISO);
                    setEndTime(endISO);



                    updateEventDetails(title, location, checkInTimeString, eventID, startISO, endISO);
                    //updateUserState(userId, { isVerified: true, isError: false });
                } else {
                    setMessage(
                        `❌ You are not at the location. You are ${Math.round(
                            distance
                        )} meters away.`
                    );
                    //updateUserState(userId, { isVerified: false, isError: false });
                    //triggerErrorFlash(userId);
                }
            } catch (error) {
                setMessage("Error verifying location.");
                //updateUserState(userId, { isVerified: false, isError: false });
                //triggerErrorFlash(userId);
            }
        },function error(msg) {alert('Please enable your GPS position feature.');},
                                            {maximumAge:10000, timeout:5000, enableHighAccuracy: true});
    };






    //Authenticates the user from their cookie once
    if(!isAuth)
    {
        setEventsFulfilled(false);
        setRole(null);
        (async () => {
            var dataPacket = await authenticate();
            setRole(dataPacket[0]);
            setCurUserName(dataPacket[2]);


            if(dataPacket[0] === "ADMIN")
            {
                setEmployees(dataPacket[3]);
                setUsers(dataPacket[4]);
                setCurUserID(dataPacket[5]);
            }

            else
            {
                //Redirect to login
            }
            setEventsList(dataPacket[1]);

        })()
    setIsAuth(true);
    }

    if(role != null && eventsFulfilled === false)
    {

        (async () => {

        var eventsResponse = await populateEvents(eventsList);
        console.log("Getting User's Events");

        displayEvents(eventsResponse);

        })()


    setEventsFulfilled(true);
    }

    if(eventsFulfilled === true)
    {
        return (



            <div className="calendar-container">
            <FullCalendar
            plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
            initialView={"dayGridMonth"}
            //dateClick={clickDate}
            eventClick={handleEventClick}

            /* Empty dates are only selectable if the user is an admin or caregiver. */
            selectable={
                (role ==="CAREGIVER" || role ==="ADMIN") ?
                true : false
            }

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

                {/*    Check In button     */}
                {((role === "CAREGIVER")) && !isEditing &&
                    <div>
                    <button
                    type="button"
                    className="submit-btn"
                    onClick={handleCheckin}
                    >Check-in
                    </button>


                    <p>{message}</p>
                    </div>

                }





                {/*  Caregiver event editing formatting */}
                { ((role === "CAREGIVER"  || role === "ADMIN") && isEditing) &&
                    <div>
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
                    <label htmlFor="event-location">Event Location *</label>
                    <input
                    id="event-location"
                    type="text"

                    value ={location}

                    disabled={!isEditing && selectedEvent}
                    onChange={ (event) => setLocation(event.target.value)}
                    required
                    maxLength={100}
                    />
                    {error ? <p className="error-txt">{error}</p>: null}
                    </div>

                    <div className = "form-section">
                    <label htmlFor="event-employee">Caregiver *</label>
                    <select
                    name="Caregivers"
                    onChange={e => handleEmployeeSelect(e)}
                    disabled={!isEditing && selectedEvent}
                    //value={eventEmployee}
                    required
                    >
                    <option value="">Select an Employee</option>
                    {employees.map((employee, key) =>  (
                        <option key={key} value={[employee.id, employee.fullName]}>
                        {employee.fullName}
                        </option>
                    ))}
                    </select>
                    </div>

                    <div className = "form-section">
                    <label htmlFor="event-patient">Patient *</label>
                    <select
                    name="Patients"
                    onChange={e => handleUserSelect(e)}
                    disabled={!isEditing && selectedEvent}
                    //value={eventUser}
                    required
                    >
                    <option value="">Select a Patient</option>
                    {users.map((user, key) =>  (
                        <option key={key} value={[user.id, user.fullName]}>
                        {user.fullName}
                        </option>
                    ))}
                    </select>
                    </div>


                    <div className = "form-dropdown" >
                    <label htmlFor="event-start-time"> <span>Starting Time * </span></label>
                    <div className = "form-time">
                    <select
                    name="Time-Hour"
                    onChange={e => handleHourStartSelect(e)}
                    disabled={!isEditing && selectedEvent}
                    value={eventStartHour}
                    required
                    >
                    <option value="">XX</option>
                    {hours.map((hour, key) =>  (
                        <option key={key} value={hour}>
                        {hour}
                        </option>
                    ))}
                    </select>
                    :
                    <select
                    name="Time-Minute"
                    onChange={e2 => handleMinuteStartSelect(e2)}
                    disabled={!isEditing && selectedEvent}
                    value={eventStartMinute}
                    required
                    >
                    <option value="">XX</option>
                    {minutes.map((minute, key) =>  (
                        <option key={key} value={minute}>
                        {minute}
                        </option>
                    ))}
                    </select>
                    <select
                    name="Time-AMPM"
                    onChange={e2 => handleEventStartAMPM(e2)}
                    disabled={!isEditing && selectedEvent}
                    value={eventStartAMPM}
                    required
                    >
                    <option value="">AM/PM</option>
                    {AMPM.map((val, key) =>  (
                        <option key={key} value={val}>
                        {val}
                        </option>
                    ))}
                    </select>
                    </div>
                    </div>


                    <div className = "form-dropdown" >
                    <label htmlFor="event-end-time">Ending Time *</label>
                    <div className = "form-time">
                    <select
                    name="Time-Hour"
                    onChange={e => handleHourEndSelect(e)}
                    disabled={!isEditing && selectedEvent}
                    value={eventEndHour}
                    required
                    >
                    <option value="">XX</option>
                    {hours.map((hour, key) =>  (
                        <option key={key} value={hour}>
                        {hour}
                        </option>
                    ))}
                    </select>
                    :
                    <select
                    name="Time-Minute"
                    onChange={e2 => handleMinuteEndSelect(e2)}
                    disabled={!isEditing && selectedEvent}
                    value={eventEndMinute}
                    required
                    >
                    <option value="">XX</option>
                    {minutes.map((minute, key) =>  (
                        <option key={key} value={minute}>
                        {minute}
                        </option>
                    ))}
                    </select>

                    <select
                    name="Time-AMPM"
                    onChange={e2 => handleEventEndAMPM(e2)}
                    disabled={!isEditing && selectedEvent}
                    value={eventEndAMPM}
                    required
                    >
                    <option value="">AM/PM</option>
                    {AMPM.map((val, key) =>  (
                        <option key={key} value={val}>
                        {val}
                        </option>
                    ))}
                    </select>
                    </div>
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


                    </div>
                }


                {/* Display for patients, or employees that arent editing it.*/}
                { (role === "PATIENT" || !isEditing) &&
                    <div>
                    <div className = "form-section">
                    <label htmlFor="event-patient">Title</label>
                    <div className = "display-box" value={title}>
                    {title}
                    </div>
                    </div>


                    <div className = "form-section">
                    <label htmlFor="event-patient" >Location</label>
                    <div className = "display-box" value={location}>
                    {location}
                    </div>
                    </div>


                    <div className = "form-section">
                    <label htmlFor="event-patient">Caregiver</label>
                    <div className = "display-box" value={caregiverName}>
                    {caregiverName}
                    </div>
                    </div>


                    <div className = "form-section">
                    <label htmlFor="event-patient" >Patient</label>
                    <div className = "display-box" value={patientName}>
                    {patientName}
                    </div>
                    </div>

                    <div className = "form-dropdown" >
                    <label htmlFor="event-start-time">Start Time: </label>
                    <div className = "display-box" value ={startTime.toLocaleString()}>
                    {startTime.toLocaleString()}
                    </div>
                    </div>

                    <div className = "form-dropdown" >
                    <label htmlFor="event-end-time">End Time: </label>
                    <div className = "display-box" value ={endTime.toLocaleString()}>
                    {endTime.toLocaleString()}
                    </div>
                    </div>

                    <div className = "form-dropdown" >
                    <label htmlFor="event-description">Description</label>
                    <div className = "display-box" value ={description} disabled={true}>
                    {description}
                    </div>
                    </div>

                    <div className = "form-dropdown" >
                    <label htmlFor="event-description">Check In Status</label>
                    <div className = "display-box" value ={checkInStatus} disabled={true}>
                    {checkInStatus}
                    </div>
                    </div>


                    </div>
                }






                {/*     Hides the Edit/Update/Cancel/Delete buttons for patients*/}
                { role !== "PATIENT" &&
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
                }
                </form>
                </div>
                </div>
            ) : null}

            </div>

        )
    }
}



async function updateEventDetails(title, location, info, eventID, startTime, endTime)
{
    try {
        let res = await fetch(apiBase + 'appointments/eventCheckIn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title, location: location, info: info, eventID: eventID, startTime: startTime, endTime: endTime }),
        });

    } catch (err) {
        console.log(err);
    }
}




async function authenticate() {

    let res = await fetch(apiBase + 'auth/authenticateUser', {
        credentials: 'include',
        method: 'POST',
        header: { 'Content-Type' : 'application/json'},
    });


        const data = await res.json();
        //Returns the authenticated cookie data as debug data.
        console.log("getting calendar events...");


        var role = data.role;
        var events = data.events;
        var name = data.fullName;
        if(data.role === "ADMIN")
        {
            var employees = data.empl;
            var users = data.user;
            var adminID = data.id;
            return [role, events, name, employees, users, adminID];
        }
        else
        {
            return [role, events, name];
        }



        //From here, we can request the calendar event IDs, for display
}


async function requestAddEvent(employeeID, userID, startTime, endTime, title, description, location, adminID)
{

    var eventID;

    try {
        let res = await fetch(apiBase + 'appointments/newEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title, location: location, description: description, startTime: startTime, endTime: endTime}),
        });
        const data = await res.json();
        //console.log(res.body); //= res.body.eventID;
        eventID = data.eventID;
        //console.log("eventID: ", eventID);

        if(res.ok)
        {

            console.log("eventID: ", eventID);
            //get the returned eventID, and make a request to add it to the emmployee and user DB entries.

            let userIDs = [parseInt(employeeID), parseInt(userID), parseInt(adminID)];
            console.log(userIDs);
            let res2 = await fetch(apiBase + 'auth/addEventUsers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIDs: userIDs, eventID: eventID })
            });


            if(res2.ok)
            {
                console.log("Successfully created Event.");
            }

        }


    } catch (err) {
        console.log(err);
    }
    return (eventID);
}


async function requestUpdateEvent(caregiver, patient, newCaregiver, newPatient, title, location, description, newStart, newEnd, eventID)
{

    try {
        let res = await fetch(apiBase + 'appointments/updateEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title, location: location, description: description, newStart: newStart, newEnd: newEnd, eventID: eventID}),
        });


        console.log("Current: ", caregiver, patient);
        console.log("new: ", newCaregiver, newPatient);
        //Update users with the event ID, removing or adding as needed.
        //eventID = res.body; //= res.body.eventID;
        //get the returned eventID, and make a request to add it to the emmployee and user DB entries.
        let res2 = await fetch(apiBase + 'auth/updateEventUsers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventID: eventID, caregiver: caregiver, patient: patient, newCaregiver: newCaregiver, newPatient: newPatient })
        });

        if(res2.ok)
        {
            console.log("Successfully Updated Event.");
        }

    } catch (err) {
        console.log(err);
    }
    return eventID;



}


async function requestDeleteEvent(eventID, caregiverName, patientName, adminID)
{
    let res;
    try {

        res = await fetch(apiBase + 'appointments/deleteEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventID: eventID}),
        });

        if(res.ok)
        {
            console.log("Successfully deleted google Event.");
        }



        console.log("Deleted event: ", eventID);
        //let userIDs = [parseInt(employeeID), parseInt(userID)];
        let res2 = await fetch(apiBase + 'auth/removeEventUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventID: eventID, caregiver: caregiverName, patient: patientName, admin: adminID })
        });

        if(res2.ok)
        {
            console.log("Successfully removed users from event.");
        }


    } catch(err) {
        console.log(err);
    }

}


async function populateEvents(eventList)
{
    let res;
    try {
        res = await fetch(apiBase + 'appointments/getUserEvents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventList: eventList }),
        });

        const data = await res.json();
        var googleEvents = data.outputList;
        console.log("Found User Google Events");
        return googleEvents;


    } catch(err) {
        console.log(err);
    }

}



export default Calendar;
