import React from 'react';

const AboutPage = () => {
  return (
    <div className="bg-white min-h-screen py-16 px-6 sm:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          About <span className="text-blue-600">FillCart</span>
        </h1>
        <p className="text-lg text-gray-600 mb-12 text-center leading-relaxed">
          Welcome to FillCart, your premier destination for a smart, seamless, and AI-driven shopping experience. 
          We are more than just a marketplace; we are a technology-first platform designed to bridge the gap 
          between high-quality vendors and tech-savvy consumers.
        </p>

        <div className="grid md:grid-cols-2 gap-12 mt-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Our Vision</h2>
            <p className="text-gray-600">
              At FillCart, we leverage cutting-edge Full Stack architecture and AI workflows to simplify 
              online commerce. From lightning-fast interfaces to personalized recommendations powered by 
              the Gemini API, every detail is engineered for efficiency.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Why FillCart?</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Scalable Next.js & MERN Stack for a smooth experience.</li>
              <li>Secure transactions integrated with Paddle.</li>
              <li>AI-powered insights for smarter shopping.</li>
              <li>Verified multi-vendor ecosystem ensuring quality.</li>
            </ul>
          </div>
        </div>

        <div className="mt-20 bg-gray-50 p-10 rounded-2xl border border-gray-100">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Our Mission</h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto italic">
            "To revolutionize the way people shop by integrating artificial intelligence and modern 
            software engineering into every interaction, making eCommerce faster, safer, and more intuitive."
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;