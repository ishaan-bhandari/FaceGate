import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import EventList from './components/EventList';
import AttendanceTracker from './components/AttendanceTracker';
import Dashboard from './components/Dashboard';
import EventForm from './components/EventForm';
import AttendanceList from './components/AttendanceList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/" exact component={Dashboard} />
          <Route path="/events" component={EventList} />
          <Route path="/attendance/:eventId" component={AttendanceTracker} />
          <Route path="/event/new" component={EventForm} />
          <Route path="/attendanceList/:eventId" component={AttendanceList} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
