import { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { useCategories } from '@/hooks/useCategories';
import { InstallPWA } from '@/components/ui/InstallPWA';
import { useToast } from '@/components/ui/Toast';
import { requestNotificationPermission, subscribeToPushNotifications } from '@/utils/pushManager';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '#', label: 'Categories' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [desktopProfileOpen, setDesktopProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  const { count, lastAddedId } = useCart();
  const { ids } = useWishlist();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { categories } = useCategories();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { notify } = useToast();

  const [pushSupported] = useState('serviceWorker' in navigator && 'PushManager' in window);
  const [pushPermission, setPushPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleEnablePush = async () => {
    try {
      const perm = await requestNotificationPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        await subscribeToPushNotifications();
        notify('Push notifications enabled!');
      } else {
        notify('Notification permission denied', 'error');
      }
    } catch (err: any) {
      console.error(err);
      notify(err.message || 'Failed to enable notifications', 'error');
    }
  };

  const isHome = location.pathname === '/';
  const showHero = isHome && !sessionStorage.getItem('hasSeenHero');
  const transparent = showHero && !scrolled && !mobileOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
    setProfileOpen(false);
    setDesktopProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
        setMegaOpen(false);
        setProfileOpen(false);
        setDesktopProfileOpen(false);
        setNotiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      {/* Mobile Menu Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}
      
      <header
        ref={navRef}
        className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        transparent
          ? 'bg-transparent'
          : 'bg-cream/90 shadow-soft backdrop-blur-md dark:bg-[#1c1712]/90'
      )}
    >
      <nav className="container-x flex h-16 items-center justify-between gap-4 md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src="/logo-256.png"
            alt="Manju's Atelier logo"
            width={44}
            height={44}
            className="h-10 w-10 rounded-full object-cover ring-1 ring-gold/40 md:h-11 md:w-11"
          />
          <span
            className={cn(
              'font-serif text-xl leading-none md:text-2xl',
              transparent ? 'text-white' : 'text-brown-dark dark:text-beige'
            )}
          >
            Manju&apos;s Atelier
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li
              key={link.to}
              onMouseEnter={() => link.label === 'Categories' && setMegaOpen(true)}
              onMouseLeave={() => link.label === 'Categories' && setMegaOpen(false)}
              className="relative"
            >
              <NavLink
                to={link.to}
                onClick={(e) => {
                  if (link.label === 'Categories') {
                    e.preventDefault();
                    setMegaOpen(!megaOpen);
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    transparent
                      ? 'text-white/90 hover:text-white'
                      : 'text-brown-dark hover:text-brown dark:text-beige hover:bg-brown/5 dark:hover:bg-beige/10',
                    isActive && !transparent && link.label !== 'Categories' && 'text-brown bg-brown/10 dark:bg-beige/10',
                    isActive && transparent && link.label !== 'Categories' && 'bg-white/20 text-white'
                  )
                }
              >
                {link.label}
                {link.label === 'Categories' && <ChevronDown size={14} className={cn("transition-transform", megaOpen && "rotate-180")} />}
              </NavLink>

              {/* Mega menu */}
              {link.label === 'Categories' && (
                <AnimatePresence>
                  {megaOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-1/2 top-full w-[520px] -translate-x-1/2 pt-3"
                    >
                      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-3 shadow-lift dark:bg-[#26201a]">
                        {categories.map((c) => (
                          <Link
                            key={c._id}
                            to={`/shop?category=${c.slug}`}
                            className="flex flex-col rounded-xl px-4 py-3 transition-colors hover:bg-beige/40 dark:hover:bg-beige/10"
                          >
                            <span className="font-medium text-brown-dark dark:text-beige">
                              {c.name}
                            </span>
                            <span className="text-xs text-brown/50 dark:text-beige/50">
                              {c.productCount ?? 0} items
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <IconButton label="Search" transparent={transparent} onClick={() => setSearchOpen((v) => !v)}>
            <Search size={20} />
          </IconButton>

          <div className="hidden md:block">
            <IconButton 
              label="Theme" 
              transparent={transparent} 
              onClick={toggle}
              title={theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
            >
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </IconButton>
          </div>

          {pushSupported && pushPermission !== 'granted' && (
            <div className="hidden md:block">
              <IconButton 
                label="Enable Push Notifications" 
                transparent={transparent} 
                onClick={handleEnablePush}
                title="Enable Push Notifications"
              >
                <Bell size={20} className="animate-pulse text-gold" />
              </IconButton>
            </div>
          )}

          <Link to="/wishlist" className="relative hidden md:block">
            <IconButton label="Wishlist" transparent={transparent}>
              <Heart size={20} />
              {ids.length > 0 && <Counter value={ids.length} />}
            </IconButton>
          </Link>

          <Link to="/cart" className="relative">
            <IconButton label="Cart" transparent={transparent}>
              <motion.span
                key={lastAddedId}
                animate={lastAddedId ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                <ShoppingBag size={20} />
              </motion.span>
              {count > 0 && <Counter value={count} />}
            </IconButton>
          </Link>

          {/* Notifications */}
          {user && (
            <div className="relative">
              <IconButton 
                label="Notifications" 
                transparent={transparent}
                onClick={() => {
                  setNotiOpen(!notiOpen);
                  setDesktopProfileOpen(false);
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && <Counter value={unreadCount} />}
              </IconButton>
              
              <AnimatePresence>
                {notiOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full w-80 pt-2 z-50"
                  >
                <div className="flex max-h-96 flex-col overflow-hidden rounded-2xl bg-white shadow-lift dark:bg-[#26201a]">
                  <div className="flex items-center justify-between border-b border-brown/10 p-3 dark:border-beige/10">
                    <h3 className="font-medium text-brown-dark dark:text-beige">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-forest hover:underline">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-brown/50 dark:text-beige/50">
                        No notifications yet.
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => {
                              if (!n.read) markAsRead(n._id);
                              if (n.link) navigate(n.link);
                            }}
                            className={cn(
                              'cursor-pointer border-b border-brown/5 p-3 text-left transition-colors last:border-0 hover:bg-beige/30 dark:border-beige/5 dark:hover:bg-beige/5',
                              !n.read && 'bg-beige/10 dark:bg-beige/5'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1 shrink-0 text-forest">
                                <CheckCircle2 size={16} />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className={cn("text-sm", !n.read ? "font-semibold text-brown-dark dark:text-beige" : "text-brown dark:text-beige/90")}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-brown/70 dark:text-beige/70 leading-relaxed">
                                  {n.message}
                                </p>
                                <p className="text-[10px] text-brown/50 dark:text-beige/50">
                                  {formatDate(n.createdAt)}
                                </p>
                              </div>
                              {!n.read && (
                                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              )}
              </AnimatePresence>
            </div>
          )}

          {/* Profile */}
          <div className="relative hidden md:block">
            <IconButton 
              label="Account" 
              transparent={transparent} 
              onClick={() => {
                setDesktopProfileOpen(!desktopProfileOpen);
                setNotiOpen(false);
              }}
            >
              <User size={20} />
            </IconButton>
            
            <AnimatePresence>
              {desktopProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full w-48 pt-2 z-50"
                >
                  <div className="rounded-2xl bg-white p-2 shadow-lift dark:bg-[#26201a]">
                    {user ? (
                      <>
                        <p className="px-3 py-2 text-sm text-brown/60 dark:text-beige/60">
                          Hi, {user.name.split(' ')[0]}
                        </p>
                        <Link to="/account" onClick={() => setDesktopProfileOpen(false)} className="menu-item">
                          My Account
                        </Link>
                        {user.role === 'admin' && (
                          <Link to="/admin" onClick={() => setDesktopProfileOpen(false)} className="menu-item">
                            Admin Dashboard
                          </Link>
                        )}
                        <button onClick={() => { setDesktopProfileOpen(false); logout(); }} className="menu-item flex w-full items-center gap-2">
                          <LogOut size={15} /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setDesktopProfileOpen(false)} className="menu-item">
                          Login
                        </Link>
                        <Link to="/login?mode=register" onClick={() => setDesktopProfileOpen(false)} className="menu-item">
                          Create account
                        </Link>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className={cn(
              'ml-0.5 sm:ml-1 rounded-full p-1.5 md:p-2 lg:hidden',
              transparent ? 'text-white' : 'text-brown-dark dark:text-beige'
            )}
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-brown/10 bg-cream dark:bg-[#1c1712]"
          >
            <form onSubmit={submitSearch} className="container-x flex items-center gap-3 py-4">
              <Search size={20} className="text-brown/50" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search handmade treasures…"
                className="flex-1 bg-transparent text-brown-dark outline-none placeholder:text-brown/40 dark:text-beige"
              />
              <button type="submit" className="btn bg-brown px-5 py-2 text-sm text-cream">
                Search
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="overflow-hidden bg-cream lg:hidden dark:bg-[#1c1712]">
          <div className="max-h-[calc(100vh-80px)] overflow-y-auto">
              <ul className="container-x flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  {link.label === 'Categories' ? (
                    <>
                      <button
                        onClick={() => setMegaOpen(!megaOpen)}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-brown-dark hover:bg-beige/40 dark:text-beige dark:hover:bg-beige/10"
                      >
                        {link.label}
                        <ChevronDown size={16} className={cn("transition-transform", megaOpen && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {megaOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col gap-1 pl-8 pr-4 pt-1 pb-2">
                              {categories.map((c) => (
                                <Link
                                  key={c._id}
                                  to={`/shop?category=${c.slug}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="block rounded-xl px-4 py-2 text-sm text-brown-dark hover:bg-beige/40 dark:text-beige dark:hover:bg-beige/10"
                                >
                                  {c.name} ({c.productCount ?? 0})
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <NavLink
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-brown-dark hover:bg-beige/40 dark:text-beige dark:hover:bg-beige/10"
                    >
                      {link.label}
                    </NavLink>
                  )}
                </li>
              ))}
              <li className="mt-2 border-t border-brown/10 pt-2 flex gap-2 px-4 pb-2">
                  <button onClick={() => { toggle(); setMobileOpen(false); }} className="flex-1 rounded-xl bg-beige/20 dark:bg-beige/5 py-2 text-center text-brown-dark dark:text-beige flex items-center justify-center gap-2">
                   {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
                 </button>
                 <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="flex-1 rounded-xl bg-beige/20 dark:bg-beige/5 py-2 text-center text-brown-dark dark:text-beige flex items-center justify-center gap-2">
                   <Heart size={16} /> Wishlist
                 </Link>
              </li>
              {pushSupported && pushPermission !== 'granted' && (
                <li className="px-4 pb-2">
                  <button onClick={handleEnablePush} className="w-full rounded-xl bg-gold/20 py-2 text-center text-brown-dark dark:text-beige flex items-center justify-center gap-2 font-medium">
                    <Bell size={16} className="text-gold" /> Enable Notifications
                  </button>
                </li>
              )}
              {user ? (
                <li className="border-t border-brown/10 pt-2">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-brown-dark hover:bg-beige/40 dark:text-beige dark:hover:bg-beige/10"
                  >
                    <span className="flex items-center gap-2"><User size={18} /> Profile</span>
                    <ChevronDown size={16} className={cn("transition-transform", profileOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-1 pl-8 pr-4 pt-1 pb-2">
                          <Link to="/account" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-2 text-sm text-brown-dark hover:bg-beige/40 dark:text-beige dark:hover:bg-beige/10">
                            My Orders
                          </Link>
                          {user.role === 'admin' && (
                            <Link to="/admin" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-2 text-sm text-brown-dark hover:bg-beige/40 dark:text-beige dark:hover:bg-beige/10">
                              Admin Dashboard
                            </Link>
                          )}
                          <button onClick={() => { setMobileOpen(false); logout(); }} className="block w-full rounded-xl px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ) : (
                <li className="border-t border-brown/10 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-brown-dark hover:bg-beige/40 dark:text-beige dark:hover:bg-beige/10"
                  >
                    Login / Register
                  </Link>
                </li>
              )}
              <li className="mt-2 border-t border-brown/10 pt-4 px-4 pb-2">
                <InstallPWA className="w-full justify-center" />
              </li>
            </ul>
            </div>
          </div>
      )}
    </header>
    </>
  );
}

function IconButton({
  children,
  label,
  transparent,
  onClick,
  title,
}: {
  children: React.ReactNode;
  label: string;
  transparent: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={title || label}
      className={cn(
        'relative rounded-full p-1.5 md:p-2 transition-colors',
        transparent
          ? 'text-white hover:bg-white/15'
          : 'text-brown-dark hover:bg-brown/10 dark:text-beige dark:hover:bg-beige/10'
      )}
    >
      {children}
    </button>
  );
}

function Counter({ value }: { value: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-brown-dark">
      {value}
    </span>
  );
}
