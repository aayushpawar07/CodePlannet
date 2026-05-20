import { useEffect, useState } from 'react';
import falconsLogo from '../assets/falcon.png';

const getInitialTheme = () => {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export default function Footer() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <footer className="mt-12 border-t border-border bg-surface/60 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                <img
                  src={falconsLogo}
                  alt="Falcons logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Falconz</p>
                <p className="text-xs text-text-light">Team Falconz</p>
              </div>
            </div>
            <p className="text-xs text-text-light">
              Assessment Platform for role-based testing, results, and team-level visibility.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-sm font-semibold text-text">Product</p>
            <p className="text-text-light">Assessments</p>
            <p className="text-text-light">Results</p>
            <p className="text-text-light">Teams & Roles</p>
            <p className="text-text-light">Admin Tools</p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-sm font-semibold text-text">Support</p>
            <p className="text-text-light">Help Center</p>
            <p className="text-text-light">Contact: support@falconz.local</p>
            <p className="text-text-light">Status: Operational</p>
            <p className="text-text-light">Security: OTP + JWT</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-text">Preferences</p>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-primary/10 transition"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <p className="text-xs text-text-light">Developed by Team Falconz</p>
            <p className="text-xs text-text-light">Copyright 2026 and created by Team Falconz</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
