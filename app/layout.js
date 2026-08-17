export const metadata = {
  title: 'Spark Clinic',
  description: 'عيادة سبارك للحجز أونلاين',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
