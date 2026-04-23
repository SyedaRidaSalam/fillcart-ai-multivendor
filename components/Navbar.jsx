"use client";

import { useUser, useClerk, UserButton, useAuth } from "@clerk/nextjs";
import {
  Menu,
  PackageIcon,
  ShoppingCart,
  X,
  Home,
  Store,
  Search,
  Info,
  Mail,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";

const Navbar = () => {
  const { user } = useUser();
  const { has } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const cartCount = useSelector((state) => state.cart.total);

  const isPlus = has?.({ plan: "plus" });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/shop?search=${search}`);
    setIsMenuOpen(false); // Close menu after search
  };

  return (
    <>
      <nav className="top-0 z-[100] bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* LOGO */}
            <Link href="/" className="relative text-3xl font-semibold text-slate-700">
              <span className="text-green-600">Fill</span>Cart
              <span className="text-green-600 text-4xl leading-0">.</span>
              {isPlus && (
                <p className="absolute text-[10px] font-bold -top-1 -right-8 px-2 py-0.5 rounded-full text-white bg-green-500 uppercase tracking-tighter">
                  plus
                </p>
              )}
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden md:flex items-center gap-8 text-slate-600 font-medium">
              <Link href="/" className={`hover:text-green-600 transition ${pathname === "/" ? "text-green-600" : ""}`}>Home</Link>
              <Link href="/shop" className={`hover:text-green-600 transition ${pathname === "/shop" ? "text-green-600" : ""}`}>Shop</Link>
              <Link href="/about" className="hover:text-green-600 transition">About</Link>
              <Link href="/contact" className="hover:text-green-600 transition">Contact</Link>

              {/* SEARCH BAR DESKTOP */}
              <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-sm group">
                <Search size={16} className="text-slate-500 group-focus-within:text-green-600" />
                <input
                  type="text"
                  placeholder="Search products"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent outline-none w-32 focus:w-48 transition-all"
                />
              </form>

              <Link href="/cart" className="relative flex items-center gap-2 hover:text-green-600 transition">
                <ShoppingCart size={20} />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -left-2 text-[10px] text-white bg-slate-600 size-4 flex items-center justify-center rounded-full border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {!user ? (
                <button onClick={openSignIn} className="px-8 py-2.5 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full text-sm font-bold shadow-md">
                  Login
                </button>
              ) : (
                <UserButton appearance={{ elements: { userButtonAvatarBox: "size-9" } }}>
                  <UserButton.MenuItems>
                    <UserButton.Action labelIcon={<PackageIcon size={16} />} label="My Orders" onClick={() => router.push("/orders")} />
                  </UserButton.MenuItems>
                </UserButton>
              )}
            </div>

            {/* MOBILE TOGGLE BUTTON */}
            <div className="md:hidden flex items-center gap-4">
              <Link href="/cart" className="relative">
                <ShoppingCart size={24} className="text-slate-600" />
                {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] size-4 rounded-full flex items-center justify-center">{cartCount}</span>}
              </Link>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 p-1">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE SIDEBAR OVERLAY */}
        {isMenuOpen && (
          <>
            {/* Background Backdrop - Is se sidebar ke peeche wala content block ho jayega aur touch pe menu band hoga */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110] md:hidden" 
              onClick={() => setIsMenuOpen(false)} 
            />
            
            {/* Sidebar Content */}
            <div className="fixed top-0 right-0 h-screen w-[280px] bg-white z-[120] shadow-2xl p-6 flex flex-col md:hidden animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between mb-8">
                <p className="font-bold text-slate-800">Menu</p>
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-500"><X size={24} /></button>
              </div>

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-6 relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-3 pl-10 rounded-xl bg-slate-50 border border-gray-100 outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </form>

              <div className="flex flex-col gap-2 flex-1">
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition-all">
                  <div className="flex items-center gap-3"><Home size={20} className="text-green-600" /> Home</div>
                  <ChevronRight size={16} className="text-slate-300" />
                </Link>

                <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition-all">
                  <div className="flex items-center gap-3"><Store size={20} className="text-green-600" /> Shop</div>
                  <ChevronRight size={16} className="text-slate-300" />
                </Link>

                <Link href="/about" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition-all">
                  <div className="flex items-center gap-3"><Info size={20} className="text-green-600" /> About</div>
                  <ChevronRight size={16} className="text-slate-300" />
                </Link>

                <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition-all">
                  <div className="flex items-center gap-3"><Mail size={20} className="text-green-600" /> Contact</div>
                  <ChevronRight size={16} className="text-slate-300" />
                </Link>

                {user && (
                  <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition-all">
                    <div className="flex items-center gap-3"><PackageIcon size={20} className="text-green-600" /> My Orders</div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                )}
              </div>

              {/* Bottom Section */}
              <div className="pt-6 border-t mt-auto">
                {!user ? (
                  <button onClick={() => { openSignIn(); setIsMenuOpen(false); }} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">
                    Get Started
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Account</span>
                        <span className="text-sm font-semibold truncate max-w-[120px]">{user.firstName || "Profile"}</span>
                    </div>
                    <UserButton />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  );
};

export default Navbar;