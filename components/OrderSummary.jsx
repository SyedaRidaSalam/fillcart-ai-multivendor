"use client";

import { PlusIcon, SquarePenIcon, XIcon } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import AddressModal from "./AddressModal";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getToken, useUser } from "@clerk/nextjs";
import axios from "axios";
import { fetchCart } from "@/lib/features/cart/cartSlice";
import { initializePaddle } from "@paddle/paddle-js";

const OrderSummary = ({ totalPrice, items }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  const router = useRouter();
  const { user } = useUser();
  const dispatch = useDispatch();

  const addressList = useSelector((state) => state.address.list);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [paddle, setPaddle] = useState(null);
  const [dbPlan, setDbPlan] = useState("free");

  const isPlus = dbPlan === "plus";
  const shippingFee = isPlus ? 0 : 5;
  const discountAmount = coupon ? (coupon.discount / 100) * totalPrice : 0;
  const finalTotal = totalPrice - discountAmount + shippingFee;

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (user?.id) {
        try {
          const { data } = await axios.get(`/api/user-plan?userId=${user.id}`);
          setDbPlan(data.plan.toLowerCase());
        } catch (error) {
          console.error("Error fetching plan:", error);
        }
      }
    };
    fetchUserPlan();
  }, [user?.id]);

  useEffect(() => {
    initializePaddle({
      environment: "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    }).then((instance) => setPaddle(instance));
  }, []);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to place an order");
    if (!selectedAddress) return toast.error("Please select an address");

    try {
      const token = await getToken();
      const orderData = {
        addressId: selectedAddress.id,
        items,
        paymentMethod,
        couponCode: coupon?.code || null,
      };

      const { data } = await axios.post("/api/orders", orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (paymentMethod === "PADDLE" && paddle) {
        paddle.Checkout.open({
          settings: { displayMode: "overlay", theme: "light" },
          items: [{
            priceId: "pri_01kpy9dt32f9ezc1wdnznhdhdk", // Ensure this is your correct Sandbox Price ID
            quantity: Math.round(finalTotal),
          }],
          customData: {
            orderIds: data.orderIds.join(","),
            userId: user.id,
          },
          eventCallback: async (event) => {
            console.log("Paddle Event:", event.name);
            
            // ✅ SUCCESS logic: Jab payment confirm ho jaye
            if (event.name === "checkout.completed" || event.name === "transaction.completed") {
              toast.success("Payment Successful!");
              
              // 1. Foran Cart fetch karein (Backend se cart khali ho chuka hoga order api ki wajah se)
              await dispatch(fetchCart({ getToken }));
              
              // 2. Direct Redirect (Wait mat karo checkout close hone ka)
              router.push("/orders");
              router.refresh();
            }
          },
          onCheckoutClosed: () => {
            console.log("Checkout closed by user");
          },
        });
      } else {
        // ✅ COD FLOW (Jo aapne kaha sahi chal raha hai)
        await dispatch(fetchCart({ getToken }));
        router.push("/orders");
        toast.success("Order placed successfully! 🎉");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Something went wrong");
    }
  };

  // --- UI REMAINS EXACTLY SAME AS PER YOUR REQUEST ---
  return (
    <div className="w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7">
      <h2 className="text-xl font-medium text-slate-600">Payment Summary</h2>
      <div className="mt-2">
        <span className={`px-2 py-1 rounded-full text-[10px] ${isPlus ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          Plan: {dbPlan.toUpperCase()}
        </span>
      </div>
      <p className="text-slate-400 text-xs my-4">Payment Method</p>
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <input type="radio" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
          <label>Cash on Delivery (COD)</label>
        </div>
        <div className="flex gap-2 items-center">
          <input type="radio" checked={paymentMethod === "PADDLE"} onChange={() => setPaymentMethod("PADDLE")} />
          <label>Online Payment (Paddle)</label>
        </div>
      </div>
      <div className="my-4 py-4 border-y border-slate-200 text-slate-400">
        <p>Address</p>
        {selectedAddress ? (
          <div className="flex gap-2 items-center">
            <p>{selectedAddress.name}, {selectedAddress.city}</p>
            <SquarePenIcon onClick={() => setSelectedAddress(null)} size={18} className="cursor-pointer" />
          </div>
        ) : (
          <div>
            {addressList.length > 0 && (
              <select className="border p-2 w-full my-3 rounded" onChange={(e) => setSelectedAddress(addressList[e.target.value])}>
                <option>Select Address</option>
                {addressList.map((a, i) => <option key={i} value={i}>{a.name}, {a.city}</option>)}
              </select>
            )}
            <button onClick={() => setShowAddressModal(true)} className="flex items-center gap-1">Add Address <PlusIcon size={18} /></button>
          </div>
        )}
      </div>
      <div className="pb-4 border-b space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-medium">{currency}{Number(totalPrice).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping:</span>
          <span className={isPlus ? "text-green-600" : "font-medium"}>{isPlus ? "FREE" : `${currency}${shippingFee.toFixed(2)}`}</span>
        </div>
        {coupon && (
          <div className="flex justify-between text-red-500">
            <span>Coupon ({coupon.code}):</span>
            <span>-{currency}{discountAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="flex justify-between py-4 text-lg">
        <p className="text-slate-600 font-bold">Total:</p>
        <p className="font-bold text-slate-800">{currency}{finalTotal.toFixed(2)}</p>
      </div>
      <button onClick={handlePlaceOrder} className="w-full bg-slate-700 hover:bg-slate-800 text-white py-3 rounded-xl transition-all">
        Place Order
      </button>
      {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
    </div>
  );
};

export default OrderSummary;