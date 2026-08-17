'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAvailableSlots } from '@/lib/bookingEngine';

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  // اختيار المستخدم
  const [ageCategory, setAgeCategory] = useState(''); // children | teens | adults
  const [serviceType, setServiceType] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // بيانات العميل
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  // نتيجة الحجز
  const [bookingResult, setBookingResult] = useState(null);

  // جلب إعدادات العيادة عند الفتح
  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase.from('clinic_settings').select('*').single();
      setSettings(data);
    }
    loadSettings();
  }, []);

  // حساب السعر
  const calculatePrice = () => {
    if (!settings) return 0;
    if (isOnline) return settings.price_online;
    if (serviceType === 'كشف') return settings.price_checkup;
    if (serviceType === 'متابعة') return settings.price_followup;
    if (serviceType === 'جلسة جماعية') return settings.price_group;

    if (ageCategory === 'children') return settings.price_children;
    if (ageCategory === 'teens') return settings.price_teens;
    if (ageCategory === 'adults') return settings.price_adults;
    return 0;
  };

  // جلب المواعيد المتاحة عند تغيير التاريخ أو الفئة
  useEffect(() => {
    if (bookingDate && ageCategory) {
      getAvailableSlots(bookingDate, ageCategory).then((slots) => {
        setAvailableSlots(slots);
      });
    }
  }, [bookingDate, ageCategory]);

  // إرسال الحجز
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      alert('يرجى ارفاق صورة تحويل InstaPay لإتمام الطلب');
      return;
    }

    setLoading(true);

    try {
      // 1. رفع صورة التحويل إلى Supabase Storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const receiptUrl = supabase.storage.from('receipts').getPublicUrl(fileName).data.publicUrl;

      // 2. إنشاء Booking ID فريد (SPK-2026-XXXX)
      const uniqueNum = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `SPK-2026-${uniqueNum}`;

      // 3. تحويل الموعد المحدد للتنسيق المطلوب
      const startTime24 = convertTo24Hour(selectedSlot.start);
      const endTime24 = convertTo24Hour(selectedSlot.end);

      // 4. حفظ الحجز في قاعدة البيانات
      const { data: bookingData, error: bookingError } = await supabase.from('bookings').insert([
        {
          booking_id: bookingId,
          client_name: clientName,
          client_phone: clientPhone,
          age_category: ageCategory,
          service_type: serviceType,
          is_online: isOnline,
          booking_date: bookingDate,
          start_time: startTime24,
          end_time: endTime24,
          total_price: calculatePrice(),
          payment_receipt_url: receiptUrl,
          notes: notes,
          status: 'pending',
        },
      ]).select().single();

      if (bookingError) {
        if (bookingError.code === '23505' || bookingError.message.includes('overlapping')) {
          alert('عذراً، هذا الموعد تم حجزه مؤخراً من قبل شخص آخر. يرجى اختيار موعد آخر.');
        } else {
          throw bookingError;
        }
        setLoading(false);
        return;
      }

      setBookingResult(bookingData);
      setStep(4);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 max-w-lg mx-auto">
      {/* Header العيادة */}
      <header className="text-center my-6">
        <h1 className="text-2xl font-bold text-teal-800">Spark Clinic - عيادة سبارك</h1>
        <p className="text-sm text-slate-500 mt-1">عيادة العلاج النفسي والدعم السلوكي</p>
      </header>

      {/* خطوة 1: اختيار الفئة العمرية والخدمة */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-5">
          <h2 className="text-lg font-bold border-b pb-2 text-slate-700">1. اختيار الفئة العمرية</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'children', name: 'أطفال', sub: '3-11 سنة' },
              { id: 'teens', name: 'مراهقين', sub: '12-17 سنة' },
              { id: 'adults', name: 'بالغين', sub: '18+ سنة' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAgeCategory(item.id);
                  if (item.id !== 'adults') setIsOnline(false);
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  ageCategory === item.id
                    ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>{item.name}</div>
                <div className="text-xs text-slate-400 font-normal">{item.sub}</div>
              </button>
            ))}
          </div>

          {ageCategory && (
            <>
              <h2 className="text-lg font-bold border-b pb-2 pt-2 text-slate-700">2. نوع الخدمة</h2>
              <div className="flex flex-col gap-2">
                {['كشف', 'متابعة', 'جلسة فردية', 'جلسة جماعية'].map((srv) => (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => {
                      setServiceType(srv);
                      setIsOnline(false);
                    }}
                    className={`p-3 rounded-xl border text-right transition-all ${
                      serviceType === srv && !isOnline
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold'
                        : 'border-slate-200'
                    }`}
                  >
                    {srv}
                  </button>
                ))}

                {ageCategory === 'adults' && (
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('جلسة أونلاين');
                      setIsOnline(true);
                    }}
                    className={`p-3 rounded-xl border text-right transition-all ${
                      isOnline
                        ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold'
                        : 'border-slate-200'
                    }`}
                  >
                    جلسة Online (للكبار فقط)
                  </button>
                )}
              </div>
            </>
          )}

          {ageCategory && serviceType && (
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-teal-700 text-white rounded-xl font-bold mt-4 hover:bg-teal-800"
            >
              التالي: اختيار الموعد
            </button>
          )}
        </div>
      )}

      {/* خطوة 2: اختيار اليوم والموعد */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-5">
          <h2 className="text-lg font-bold border-b pb-2 text-slate-700">اختر التاريخ والموعد</h2>
          <div>
            <label className="block text-sm text-slate-600 mb-1">التاريخ</label>
            <input
              type="date"
              className="w-full p-3 border rounded-xl"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
          </div>

          {bookingDate && (
            <div>
              <label className="block text-sm text-slate-600 mb-2">المواعيد المتاحة</label>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-amber-600">لا توجد مواعيد متاحة في هذا اليوم أو العيادة مغلقة.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 text-sm border rounded-xl ${
                        selectedSlot?.start === slot.start
                          ? 'border-teal-600 bg-teal-50 text-teal-800 font-bold'
                          : 'border-slate-200'
                      }`}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep(1)} className="w-1/3 py-3 border border-slate-300 rounded-xl">
              رجوع
            </button>
            {selectedSlot && (
              <button
                onClick={() => setStep(3)}
                className="w-2/3 py-3 bg-teal-700 text-white rounded-xl font-bold"
              >
                التالي: بيانات العميل
              </button>
            )}
          </div>
        </div>
      )}

      {/* خطوة 3: بيانات العميل وصورة التحويل */}
      {step === 3 && (
        <form onSubmit={handleSubmitBooking} className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold border-b pb-2 text-slate-700">بيانات العميل والدفع</h2>

          <div>
            <label className="block text-sm text-slate-600 mb-1">الاسم بالكامل</label>
            <input
              required
              type="text"
              className="w-full p-3 border rounded-xl"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">رقم الهاتف (واتساب)</label>
            <input
              required
              type="tel"
              className="w-full p-3 border rounded-xl"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">ملاحظات (اختياري)</label>
            <textarea
              className="w-full p-3 border rounded-xl"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* تفاصيل السعر والدفع */}
          <div className="bg-slate-50 p-4 rounded-xl border space-y-2 text-sm">
            <div className="flex justify-between font-bold text-slate-700">
              <span>إجمالي قيمة الجلسة:</span>
              <span className="text-teal-700">{calculatePrice()} جنيه</span>
            </div>
            <div className="text-xs text-slate-500 pt-1 border-t">
              يرجى تحويل المبلغ عبر InstaPay على الرقم:
              <div className="font-mono text-slate-800 text-sm font-bold mt-1">
                {settings?.instapay_number || '01227840532'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">إرفاق صورة التحويل</label>
            <input
              required
              type="file"
              accept="image/*"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 font-bold"
              onChange={(e) => setReceiptFile(e.target.files[0])}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setStep(2)} className="w-1/3 py-3 border border-slate-300 rounded-xl">
              رجوع
            </button>
            <button
              disabled={loading}
              type="submit"
              className="w-2/3 py-3 bg-teal-700 text-white rounded-xl font-bold hover:bg-teal-800 disabled:bg-slate-300"
            >
              {loading ? 'جاري إرسال الطلب...' : 'تأكيد الحجز'}
            </button>
          </div>
        </form>
      )}

      {/* خطوة 4: صفحة نجاح إرسال الطلب والتأكيد */}
      {step === 4 && bookingResult && (
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-slate-800">تم إرسال طلب الحجز بنجاح</h2>
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
            حالة الحجز الحالية: <b>في انتظار تأكيد الإدارة للدفع</b>
          </p>

          <div className="bg-slate-50 p-4 rounded-xl text-right text-sm space-y-2 font-mono">
            <div><b>رقم الحجز:</b> {bookingResult.booking_id}</div>
            <div><b>الاسم:</b> {bookingResult.client_name}</div>
            <div><b>التاريخ:</b> {bookingResult.booking_date}</div>
            <div><b>الموعد:</b> {selectedSlot?.start}</div>
            <div><b>المبلغ المطلوب:</b> {bookingResult.total_price} جنيه</div>
          </div>

          <div className="text-xs text-slate-500 text-right space-y-1">
            <p><b>العنوان:</b> {settings?.address}</p>
            <p><b>هاتف العيادة:</b> {settings?.phone}</p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <a
              href={`https://wa.me/2${settings?.phone}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold block text-center"
            >
              تواصل عبر WhatsApp
            </a>
            <a
              href={`tel:${settings?.phone}`}
              className="w-full py-3 border border-slate-300 rounded-xl block font-bold text-center"
            >
              الاتصال بالعيادة
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function convertTo24Hour(timeStr) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'م') hours = parseInt(hours, 10) + 12;
  return `${hours}:${minutes}:00`;
}
