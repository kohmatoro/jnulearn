import React, { createContext, useState, useCallback } from "react";

export const TimetableContext = createContext({
  timetables: [],
  setTimetables: () => {},
  addTimetable: () => {},
  deleteTimetable: () => {},
  addCoursesToTimetable: () => {},
  removeCourseFromTimetable: () => {},
  getTimetable: () => null,
});

export function TimetableProvider({ children }) {
  const [timetables, setTimetables] = useState([
    { id: 1, name: "기본 시간표", credits: 0, courses: [] },
  ]);

  const addTimetable = useCallback((name) => {
    const newId = Math.max(...timetables.map(t => t.id), 0) + 1;
    const newTimetable = { id: newId, name, credits: 0, courses: [] };
    setTimetables(prev => [...prev, newTimetable]);
    return newId;
  }, [timetables]);

  const deleteTimetable = useCallback((id) => {
    if (timetables.length === 1) return false;
    setTimetables(prev => prev.filter(t => t.id !== id));
    return true;
  }, [timetables.length]);

  const addCoursesToTimetable = useCallback((timetableId, courses) => {
    setTimetables(prev =>
      prev.map(t => {
        if (t.id === timetableId) {
          return {
            ...t,
            courses: [...t.courses, ...courses],
          };
        }
        return t;
      })
    );
  }, []);

  const removeCourseFromTimetable = useCallback((timetableId, courseName) => {
    setTimetables(prev =>
      prev.map(t => {
        if (t.id === timetableId) {
          return {
            ...t,
            courses: t.courses.filter(c => {
              const name = c["과목명"] || c[" 과목명"];
              return name !== courseName;
            }),
          };
        }
        return t;
      })
    );
  }, []);

  const getTimetable = useCallback((id) => {
    return timetables.find(t => t.id === id);
  }, [timetables]);

  const value = {
    timetables,
    setTimetables,
    addTimetable,
    deleteTimetable,
    addCoursesToTimetable,
    removeCourseFromTimetable,
    getTimetable,
  };

  return (
    <TimetableContext.Provider value={value}>
      {children}
    </TimetableContext.Provider>
  );
}
