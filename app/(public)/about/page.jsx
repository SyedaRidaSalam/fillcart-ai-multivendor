import React from 'react';
import Link from 'next/link';
import { Rocket, ShieldCheck, Cpu } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-20 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Branding Header */}
        <div className="text-center mb-16">
          <Link href="/" className="text-5xl font-semibold text-slate-700 inline-block mb-4">
            <span className="text-green-600">Fill</span>Cart<span className="text-green-600 text-6xl leading-0">.</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mt-4">Next-Gen AI Commerce</h1>
        </div>

        {/* Content Cards */}
        <div className="grid gap-8">
          <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <Rocket className="text-green-600" size={32} />
              <h2 className="text-2xl font-bold text-slate-800">Our Vision</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-lg">
              FillCart is a premium multi-vendor marketplace engineered for speed and intelligence. 
              Built with the modern MERN stack and Next.js, we provide a seamless bridge between 
              innovative vendors and global consumers. Our platform isn't just about selling; 
              it's about creating a tech-driven ecosystem where every transaction is optimized.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <Cpu className="text-green-600" size={28} />
                <h3 className="text-xl font-bold text-slate-800">The Technology</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                We leverage Clerk for ultra-secure authentication and Neon DB for high-performance 
                data handling. Our AI-driven summarization ensures you get the best product 
                insights in seconds.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <ShieldCheck className="text-green-600" size={28} />
                <h3 className="text-xl font-bold text-slate-800">Secure Payments</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                With integrated Paddle support for international transactions and reliable 
                Cash on Delivery (COD) options, your financial security is our top priority.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;