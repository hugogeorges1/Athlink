export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-grayl">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-subtle border border-gray-100">
        {children}
      </div>
    </div>
  )
}
