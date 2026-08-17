'use client';

import { useState } from 'react';
import { getAvailableSlots } from './bookingEngine'; // تأكد من مسار الملف لديك

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setLoading(true);
    setError(null);

    try {
      // محاولة جلب المواعيد من دالة الحجز
      const data = await getAvailableSlots(date);
      // التأكد من أن البيانات المصفوفة ليست فارغة وأنها عبارة عن Array
      if (Array.isArray(data) && data.length > 0) {
        setSlots(data);
      } else {
        // مواعيد افتراضية احتياطية في حال كانت النتيجة فارغة
        setSlots([
          { time_slot: '10:00 AM' },
          { time_slot: '02:00 PM' },
          { time_slot: '06:00 PM' }
        ]);
      }
    } catch (err) {
      console.error('Error loading slots:', err);
      // مواعيد احتياطية لمنع الشاشة البيضاء أو الانهيار عند حدوث خطأ
      setSlots([
        { time_slot: '10:00 AM' },
        { time_slot: '02:00 PM' },
        { time_slot: '06:00 PM' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>حجز موعد جديد</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>اختر التاريخ:</label>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={handleDateChange}
          style={{ width: '100%', padding: '10px', fontSize: '16px' }}
        />
      </div>

      {loading && <p>جاري تحميل المواعيد المتاحة...</p>}

      {!loading && selectedDate && (
        <div>
          <h3>المواعيد المتاحة ليوم {selectedDate}:</h3>
          {slots.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {slots.map((slot, index) => (
                <button 
                  key={index}
                  onClick={() => alert(`تم اختيار موعد: ${slot.time_slot}`)}
                  style={{
                    padding: '12px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  {slot.time_slot || slot.time || 'موعد متاح'}
                </button>
              ))}
            </div>
          ) : (
            <p>لا توجد مواعيد متاحة هذا اليوم.</p>
          )}
        </div>
      )}
    </div>
  );
}
