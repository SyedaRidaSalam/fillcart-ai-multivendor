import React from 'react';
import { Mail, Phone, MapPin, ShieldCheck, CreditCard, UserCheck } from 'lucide-react';
import Link from 'next/link';

const ContactPage = () => {
  const contactDetails = [
    {
      icon: <Mail className="text-green-600" size={28} />,
      title: "Email Us",
      value: "support@fillcart.com",
      description: "Our support team usually responds within 24 hours.",
    },
    {
      icon: <Phone className="text-green-600" size={28} />,
      title: "Call Us",
      value: "+49 123 4567890",
      description: "Available Mon-Fri, 9:00 AM to 6:00 PM (CET).",
    },
    {
      icon: <MapPin className="text-green-600" size={28} />,
      title: "Headquarters",
      value: "Siegen, Germany",
      description: "FillCart Technologies GmbH, North Rhine-Westphalia.",
    },
  ];

  const techStack = [
    { icon: <ShieldCheck size={20} />, label: "Secure Auth by Clerk" },
    { icon: <CreditCard size={20} />, label: "Payments via Paddle & COD" },
    { icon: <UserCheck size={20} />, label: "24/7 Verified Support" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Branding & Header */}
        <div className="text-center mb-16">
          <Link href="/" className="text-5xl font-semibold text-slate-700 inline-block mb-4">
            <span className="text-green-600">Fill</span>Cart<span className="text-green-600 text-6xl leading-0">.</span>
          </Link>
          <h1 className="text-2xl text-slate-500 font-light max-w-2xl mx-auto">
            Experience the future of AI-driven commerce. We are here to help you grow your business and simplify your shopping.
          </h1>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {contactDetails.map((item, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-green-600 font-medium mb-3">{item.value}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Trust Bar (Auth & Payment Info) */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-wrap justify-center gap-10 items-center">
          {techStack.map((tech, index) => (
            <div key={index} className="flex items-center gap-3 text-slate-600 font-medium">
              <span className="bg-slate-100 p-2 rounded-full text-slate-500">
                {tech.icon}
              </span>
              {tech.label}
            </div>
          ))}
        </div>

        {/* Bottom Navigation for Better UX */}
        <div className="mt-16 flex justify-center gap-6 text-sm font-medium text-slate-400">
          <Link href="/about" className="hover:text-green-600 transition-colors text-slate-800">About Us</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-green-600 transition-colors text-slate-800">Privacy Policy</Link>
          <span>•</span>
          <Link href="/shop" className="hover:text-green-600 transition-colors text-slate-800">Explore Shop</Link>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;