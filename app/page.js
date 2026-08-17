'use client';

import { useState } from 'react';

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setSelectedDate(dateValue);

    // مواعيد ثنائية لتجربة الواجهة والتأكد من عدم الانهيار
    if (dateValue) {
      setSlots([
        { id: 1, time_slot: '10:00 AM' },
        { id: 2, time_slot: '02:00 PM' },
        { id: 3, time_slot: '06:00 PM' }
      ]);
    } else {
      setSlots([]);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>اختيار موعد الحجز</h2>
      <input 
        type="date" 
        onChange={handleDateChange}
        style={{ padding: '10px', fontSize: '16px', marginBottom: '20px' }}
      />

      {selectedDate && (
        <div>
          <h3>المواعيد المتاحة ليوم: {selectedDate}</h3>
          {slots.map((s) => (
            <button key={s.id} style={{ display: 'block', margin: '10px auto', padding: '10px 20px' }}>
              {s.time_slot}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
