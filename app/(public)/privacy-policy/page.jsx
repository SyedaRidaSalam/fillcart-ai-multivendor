import React from 'react';
import Link from 'next/link';
import { Lock, EyeOff, FileText } from 'lucide-react';

const PrivacyPolicy = () => {
  const policies = [
    {
      icon: <Lock size={24} />,
      title: "Data Security",
      text: "We use Clerk for user authentication. Your passwords and sensitive data are encrypted and never stored directly on our servers."
    },
    {
      icon: <EyeOff size={24} />,
      title: "No Third-Party Selling",
      text: "FillCart does not sell your personal information to marketing agencies. Your data is used strictly for order fulfillment and AI optimization."
    },
    {
      icon: <FileText size={24} />,
      title: "Payment Processing",
      text: "All online payments are handled by Paddle. We do not store credit card details. COD orders are verified via your registered contact info."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Branding Header */}
        <div className="text-center mb-16">
          <Link href="/" className="text-5xl font-semibold text-slate-700 inline-block mb-4">
            <span className="text-green-600">Fill</span>Cart<span className="text-green-600 text-6xl leading-0">.</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Privacy & Security Framework</h1>
          <p className="text-slate-500 text-sm mt-2 font-mono">VERSION 2026.01</p>
        </div>

        {/* Policy Cards */}
        <div className="space-y-6">
          {policies.map((p, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex gap-6 items-start">
              <div className="bg-green-50 p-3 rounded-xl text-green-600">
                {p.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 bg-slate-800 rounded-3xl text-slate-300 text-center">
          <p className="text-sm italic">
            "At FillCart, we believe privacy is a fundamental right. Our engineering team constantly monitors 
            our Neon DB clusters and Clerk webhooks to ensure your shopping experience remains private."
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;