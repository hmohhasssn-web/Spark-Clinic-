'use client';

import { useState } from 'react';

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null); // الموعد الذي اختاره المستخدم
  const [formData, setFormData] = useState({ name: '', phone: '' });

  // الأوقات المتاحة (يمكنك لاحقاً جلبها من Supabase)
  const slots = ['10:00 AM', '02:00 PM', '06:00 PM'];

  const handleBook = async () => {
    if (!formData.name || !formData.phone) {
      alert('الرجاء إدخال الاسم ورقم الهاتف');
      return;
    }
    
    // هنا مكان إرسال البيانات لقاعدة البيانات لاحقاً
    alert(`تم حجز موعد ${selectedSlot} يوم ${selectedDate} باسم ${formData.name}`);
    
    // إعادة تعيين النموذج
    setSelectedSlot(null);
    setFormData({ name: '', phone: '' });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>نظام الحجز</h2>
      
      {!selectedSlot ? (
        <>
          <label>اختر التاريخ:</label>
          <input type="date" onChange={(e) => setSelectedDate(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '20px' }} />
          
          {selectedDate && (
            <div>
              <h3>اختر وقتاً:</h3>
              {slots.map((s) => (
                <button key={s} onClick={() => setSelectedSlot(s)} style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>تأكيد الحجز ليوم {selectedDate} الساعة {selectedSlot}</h3>
          <input placeholder="الاسم" onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', marginBottom: '10px' }} />
          <input placeholder="رقم الهاتف" onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', marginBottom: '10px' }} />
          <button onClick={handleBook} style={{ width: '100%', padding: '10px', background: 'green', color: 'white' }}>تأكيد الحجز</button>
          <button onClick={() => setSelectedSlot(null)} style={{ width: '100%', padding: '10px', marginTop: '10px' }}>إلغاء</button>
        </div>
      )}
    </div>
  );
}
