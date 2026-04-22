"use client";

import { useUser, useClerk, UserButton, useAuth } from "@clerk/nextjs";
import {
  Menu,
  PackageIcon,
  ShoppingCart,
  X,
  Home,
  Store,
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
  const cartCount = useSelector((state) => state.cart.total);

  const isPlus = has?.({ plan: "plus" });

  return (
    // Sticky added for modern feel
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
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
            <Link 
              href="/" 
              className={`hover:text-green-600 transition ${pathname === "/" ? "text-green-600" : ""}`}
            >
              Home
            </Link>
            <Link 
              href="/shop" 
              className={`hover:text-green-600 transition ${pathname === "/shop" ? "text-green-600" : ""}`}
            >
              Shop
            </Link>

            <Link href="/cart" className="relative flex items-center gap-2 hover:text-green-600 transition">
              <ShoppingCart size={20} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -left-2 text-[10px] text-white bg-slate-600 size-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {!user ? (
              <button
                onClick={openSignIn}
                className="px-8 py-2.5 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full text-sm shadow-md shadow-indigo-100"
              >
                Login
              </button>
            ) : (
              <UserButton appearance={{ elements: { userButtonAvatarBox: "size-9" } }}>
                <UserButton.MenuItems>
                  <UserButton.Action
                    labelIcon={<PackageIcon size={16} />}
                    label="My Orders"
                    onClick={() => router.push("/orders")}
                  />
                </UserButton.MenuItems>
              </UserButton>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/cart" className="relative">
               <ShoppingCart size={24} className="text-slate-600" />
               {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] size-4 rounded-full flex items-center justify-center">{cartCount}</span>}
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN - SaaS Style */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-200 p-6 space-y-3 shadow-2xl animate-in slide-in-from-top duration-200">
          <Link 
            href="/" 
            onClick={() => setIsMenuOpen(false)} 
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-semibold"
          >
            <Home size={20} className="text-green-600" /> Home
          </Link>
          
          <Link 
            href="/shop" 
            onClick={() => setIsMenuOpen(false)} 
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-semibold"
          >
            <Store size={20} className="text-green-600" /> Shop
          </Link>

          {/* MY ORDERS - Ab mobile pe saaf dikhega */}
          {user && (
            <Link 
              href="/orders" 
              onClick={() => setIsMenuOpen(false)} 
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-semibold"
            >
              <PackageIcon size={20} className="text-green-600" /> My Orders
            </Link>
          )}

          <div className="pt-4 border-t">
            {!user ? (
              <button 
                onClick={openSignIn} 
                className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold"
              >
                Sign In
              </button>
            ) : (
              <div className="flex justify-between items-center p-3 bg-slate-900 rounded-2xl text-white">
                <span className="font-medium ml-2">My Account</span>
                <UserButton />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;