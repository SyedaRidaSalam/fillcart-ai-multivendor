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

  const checkoutOpened = useRef(false);

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

  const isPlus = dbPlan === "plus";
  const shippingFee = isPlus ? 0 : 5;

  const discountAmount = coupon ? (coupon.discount / 100) * totalPrice : 0;
  const finalTotal = totalPrice - discountAmount + shippingFee;

  useEffect(() => {
    initializePaddle({
      environment: "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    }).then((instance) => setPaddle(instance));
  }, []);

  const handleCouponCode = async (event) => {
    event.preventDefault();
    try {
      if (!user) return toast.error("Please login first");
      const { data } = await axios.post("/api/coupon", {
        code: couponCodeInput,
      });
      setCoupon(data.coupon);
      toast.success("Coupon applied!");
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } 
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to place an order");
    if (!selectedAddress) return toast.error("Please select an address");

    // ✅ PADDLE CASE: Order creation happens first so DB is updated
    if (paymentMethod === "PADDLE") {
      if (!paddle) return toast.error("Payment gateway not ready");
      
      const loadingToast = toast.loading("Preparing your order...");
      try {
        const token = await getToken();
        const orderData = {
          addressId: selectedAddress.id,
          items,
          paymentMethod,
          couponCode: coupon?.code || null,
        };

        // Create Order in DB (backend should mark as isPaid: false initially or handle via webhook)
        const { data } = await axios.post("/api/orders", orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.dismiss(loadingToast);
        checkoutOpened.current = true;

        paddle.Checkout.open({
          settings: { 
            displayMode: "overlay", 
            theme: "light",
            successUrl: window.location.origin + "/orders"
          },
          items: [{
            priceId: "pri_01kpy9dt32f9ezc1wdnznhdhdk",
            quantity: Math.round(finalTotal),
          }],
          customData: {
            orderIds: data.orderIds.join(","),
            userId: user.id,
          },
          eventCallback: async (event) => {
            // ✅ Payment complete hone par hi cart khali hogi aur redirect hoga
            if (event.name === "checkout.completed" || event.name === "transaction.completed") {
              toast.success("Payment Successful! 🎉");
              await dispatch(fetchCart({ getToken }));
              router.push("/orders");
            }
          },
        });
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(error.response?.data?.error || "Failed to initiate order.");
      }
      return;
    }

    // ✅ COD CASE
    const placeOrderPromise = async () => {
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

      await dispatch(fetchCart({ getToken }));
      router.push("/orders");
      return data;
    };

    toast.promise(placeOrderPromise(), {
      loading: "Processing your order...",
      success: "Order placed successfully! 🎉",
      error: (err) => err.response?.data?.error || "Failed to place order.",
    });
  };

  return (
    <div className="w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7">
      <h2 className="text-xl font-medium text-slate-600">Payment Summary</h2>

      <div className="mt-2">
        <span className={`px-2 py-1 rounded-full text-[10px] ${isPlus ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          Plan: {dbPlan.toUpperCase()}
        </span>
      </div>

      <p className="text-slate-400 text-xs my-4 font-medium uppercase">Payment Method</p>
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <input type="radio" id="cod" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
          <label htmlFor="cod" className="cursor-pointer">COD (Cash on Delivery)</label>
        </div>
        <div className="flex gap-2 items-center">
          <input type="radio" id="paddle" checked={paymentMethod === "PADDLE"} onChange={() => setPaymentMethod("PADDLE")} />
          <label htmlFor="paddle" className="cursor-pointer">Online Payment (Paddle)</label>
        </div>
      </div>

      <div className="my-4 py-4 border-y border-slate-200 text-slate-400">
        <p className="text-xs uppercase font-medium mb-2">Address</p>
        {selectedAddress ? (
          <div className="flex gap-2 items-center text-slate-700">
            <p className="text-xs">{selectedAddress.name}, {selectedAddress.city}</p>
            <SquarePenIcon onClick={() => setSelectedAddress(null)} size={18} className="cursor-pointer text-slate-400" />
          </div>
        ) : (
          <div>
            {addressList.length > 0 && (
              <select className="border p-2 w-full my-2 rounded bg-white text-slate-600" onChange={(e) => setSelectedAddress(addressList[e.target.value])}>
                <option value="">Select Address</option>
                {addressList.map((a, i) => (
                  <option key={i} value={i}>{a.name}, {a.city}</option>
                ))}
              </select>
            )}
            <button onClick={() => setShowAddressModal(true)} className="flex items-center gap-1 text-xs mt-1">
              Add Address <PlusIcon size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="pb-4 border-b">
        <div className="flex justify-between">
          <div className="text-slate-400 space-y-1">
            <p>Subtotal:</p>
            <p>Shipping:</p>
            {coupon && <p className="text-green-600 italic">Coupon ({coupon.code}):</p>}
          </div>
          <div className="text-right font-medium space-y-1 text-slate-700">
            <p>{currency}{Number(totalPrice).toFixed(2)}</p>
            <p className={isPlus ? "text-green-600" : ""}>
              {isPlus ? "FREE" : `${currency}${shippingFee.toFixed(2)}`}
            </p>
            {coupon && <p className="text-red-500">-{currency}{discountAmount.toFixed(2)}</p>}
          </div>
        </div>
      </div>

      {!coupon ? (
        <form onSubmit={(e) => toast.promise(handleCouponCode(e), { loading: "Checking..." })} className="flex gap-2 mt-3">
          <input
            value={couponCodeInput}
            onChange={(e) => setCouponCodeInput(e.target.value)}
            placeholder="Coupon Code"
            className="border p-2 w-full rounded outline-none text-slate-700"
          />
          <button className="bg-slate-600 text-white px-3 rounded text-xs">Apply</button>
        </form>
      ) : (
        <div className="flex justify-between items-center bg-green-50 p-2 mt-2 rounded border border-green-200">
          <div>
            <p className="font-bold text-green-700 text-xs">{coupon.code}</p>
            <p className="text-[10px] text-green-600">{coupon.description}</p>
          </div>
          <XIcon onClick={() => setCoupon("")} size={16} className="text-green-700 cursor-pointer" />
        </div>
      )}

      <div className="flex justify-between py-4 text-lg">
        <p className="text-slate-600 font-bold">Total:</p>
        <p className="font-bold text-slate-800">{currency}{finalTotal.toFixed(2)}</p>
      </div>

      <button onClick={handlePlaceOrder} className="w-full bg-slate-700 hover:bg-slate-800 text-white py-3 rounded-xl transition-all font-bold">
        Place Order
      </button>

      {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
    </div>
  );
};

export default OrderSummary;