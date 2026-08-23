import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the navbar and footer if we are on the admin dashboard
  const isOfficerPage = location.pathname === '/officer';

  return (
    <div className="min-h-screen flex flex-col bg-[#c1dcf7]">
      
      {/* --- TAILWIND NAVBAR --- */}
      {!isOfficerPage && (
        <nav className="flex items-center justify-between px-8 py-4 bg-[#fff6ed]/80 shadow-md text-black">
          
          {/* Left Side: Logo and Title */}
          <div className="flex items-center gap-4">
            <img 
              src="https://plus.unsplash.com/premium_photo-1666739388124-6c2889490aa7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bG9nbyUyMG9mJTIwZml4aW5nfGVufDB8fDB8fHww" 
              alt="Corp Logo" 
              className="w-12 h-12 rounded-full object-cover" 
            />
            <h1 className="m-0 text-5xl font-extrabold tracking-wide drop-shadow-md">CivicLens</h1>
          </div>

          {/* Right Side: Links and Profile */}
          <div className="flex items-center gap-8">
            <button 
              className="px-2 py-1 text-lg font-bold bg-transparent transition-colors hover:text-[#95d2df]" 
              onClick={() => navigate('/')}>
              Home
            </button>
            <button 
              className="px-2 py-1 text-lg font-bold bg-transparent transition-colors hover:text-[#95d2df]" 
              onClick={() => navigate('/login')}>
              Officer Login
            </button>
            <button 
              className="flex items-center ml-4 bg-[#e96969] transition-transform hover:scale-110 rounded-full" 
              title="Change Language">
              <img src="/en-hi.png" alt="English to Hindi Translation" className="w-8 h-8 object-contain" />
            </button>
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" 
              alt="User Profile" 
              className="w-12 h-12 rounded-full object-cover border-2 border-[#f68e8e] cursor-pointer" 
            />
          </div>
        </nav>
      )}

      {/* --- PAGE CONTENT (HOME, ADMIN, ETC) INJECTS HERE --- */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* --- TAILWIND FOOTER --- */}
      {!isOfficerPage && (
        <footer className="bg-slate-800 text-slate-50 pt-16 px-5 pb-5 mt-16">
          <div className="flex justify-around flex-wrap gap-10 max-w-6xl mx-auto border-b border-slate-700 pb-10">
            
            <div className="flex-1 min-w-[250px]">
              <h4 className="text-[#ff7062] text-xl mb-5 uppercase tracking-wide font-bold">Public Grievance Manager</h4>
              <p className="text-slate-300 leading-relaxed">
                Empowering citizens to actively participate in building a cleaner, safer, and more efficient infrastructure. Report, track, and resolve civic issues seamlessly.
              </p>
            </div>

            <div className="flex-1 min-w-[250px]">
              <h4 className="text-[#ff7062] text-xl mb-5 uppercase tracking-wide font-bold">General Information</h4>
              <ul className="list-none p-0">
                <li className="mb-3 text-slate-300 font-medium">🏢 Headquarters: Sector 4, Civic Center</li>
                <li className="mb-3 text-slate-300 font-medium">⏰ Office Hours: Mon-Sat, 9:00 AM - 5:00 PM</li>
                <li className="mb-3 text-slate-300 font-medium">📝 Nodal Officer: Public Works Department</li>
                <li className="mb-3 text-slate-300 font-medium">✉️ Email: support@civicmanager.gov</li>
              </ul>
            </div>

            <div className="flex-1 min-w-[250px]">
              <h4 className="text-[#ff7062] text-xl mb-5 uppercase tracking-wide font-bold">Emergency Helplines</h4>
              <ul className="list-none p-0">
                <li className="mb-3 text-slate-300 font-medium">📞 Municipal Toll-Free: 1800-111-2222</li>
                <li className="mb-3 text-slate-300 font-medium">🚓 Police Control Room: 123</li>
                <li className="mb-3 text-slate-300 font-medium">🚑 Ambulance Services: 194</li>
                <li className="mb-3 text-slate-300 font-medium">🚒 Fire Brigade: 121</li>
              </ul>
            </div>

          </div>
          
          <div className="text-center mt-6 pt-4 text-slate-400">
            <p>&copy; 2026 Municipal Corporation. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
}