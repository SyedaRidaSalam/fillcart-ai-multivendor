import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: April 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            At <strong>FillCart</strong>, we respect your privacy and are committed to protecting your personal data. 
            This policy explains how we handle your information when you visit our platform or make a purchase.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Data We Collect</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li><strong>Personal Information:</strong> Name, email, shipping address, and phone number provided during checkout.</li>
            <li><strong>Payment Data:</strong> All payments are processed via <strong>Paddle</strong>. We do not store your credit card details on our servers.</li>
            <li><strong>Technical Data:</strong> IP addresses and browser cookies to maintain your shopping cart and session.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">3. How We Use Your Data</h2>
          <p className="text-gray-600">
            We use your data strictly to process orders, manage your account, provide customer support, 
            and improve our AI-driven recommendation engine. We never sell your data to third-party marketers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Security</h2>
          <p className="text-gray-600">
            Your data is stored securely using cloud-based Neon DB and encrypted communication protocols. 
            By using FillCart, you consent to our use of industry-standard security measures to keep your info safe.
          </p>
        </section>

        <section className="mt-12 pt-6 border-t border-gray-100">
          <p className="text-gray-500 text-sm">
            For any questions regarding this policy, please contact our support team at <span className="text-blue-600">support@fillcart.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;