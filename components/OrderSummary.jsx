"use client";

import { PlusIcon, SquarePenIcon, XIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
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

  // ✅ New State for fresh plan from DB
  const [dbPlan, setDbPlan] = useState("free");

  // ✅ Fresh Plan fetch karein Neon DB se
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

  // ✅ SHIPPING LOGIC (Back to normal)
  const shippingFee = isPlus ? 0 : 5;

  // ✅ TOTAL CALCULATION
  const discountAmount = coupon ? (coupon.discount / 100) * totalPrice : 0;
  const finalTotal = totalPrice - discountAmount + shippingFee;

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

  useEffect(() => {
    initializePaddle({
      environment: "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    }).then((instance) => setPaddle(instance));
  }, []);

  // ✅ Paddle Initialize (Design par zero effect)
  useEffect(() => {
    initializePaddle({
      environment: "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    }).then((instance) => setPaddle(instance));
  }, []);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      if (!user) return toast.error("Please login to place an order");
      if (!selectedAddress) return toast.error("Please select an address");

      const placeOrderPromise = async () => {
        const token = await getToken();
        const orderData = {
          addressId: selectedAddress.id,
          items,
          paymentMethod, // Ab ye "PADDLE" bhejega backend ko
        };

        if (coupon) orderData.couponCode = coupon.code;

        // 1. Order create karein database mein (Normal Flow)
        const { data } = await axios.post("/api/orders", orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 2. Agar "PADDLE" selected hai toh checkout kholien
        if (paymentMethod === "PADDLE") {
          if (paddle) {
            // handlePlaceOrder ke andar jahan paddle.Checkout.open hai
            paddle.Checkout.open({
              settings: {
                displayMode: "overlay",
                theme: "light",
                // successUrl: ... ko yahan se HATA dein (ye issue karta hai)
              },
              items: [
                {
                  priceId: "pri_01kpy9dt32f9ezc1wdnznhdhdk",
                  quantity: Math.round(finalTotal),
                },
              ],
              customData: {
                orderIds: data.orderIds.join(","),
                userId: user.id,
              },
              // ✅ Ye naya event handler add karein
              eventCallback: (event) => {
                if (event.name === "checkout.completed") {
                  toast.success(
                    "Payment Received! Your order is being processed. 🚀",
                    {
                      duration: 5000,
                      icon: "✅",
                    },
                  );
                  dispatch(fetchCart({ getToken })); // Cart saaf karne ke liye
                  setTimeout(() => {
                    router.push("/orders?success=true"); // Query param add kar rahe hain refresh trigger karne ke liye
                  }, 3000);
                }
              },
            });
          }
        } else {
          router.push("/orders");
          dispatch(fetchCart({ getToken }));
        }
        return data;
      };

      toast.promise(placeOrderPromise(), {
        loading: "Placing your order...",
        success: "Order registered successfully! 🎉",
        error: (err) => err.response?.data?.error || "Failed to place order.",
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7">
      <h2 className="text-xl font-medium text-slate-600">Payment Summary</h2>

      {/* Plan Badge for Debugging (Optional) */}
      <div className="mt-2">
        <span
          className={`px-2 py-1 rounded-full text-[10px] ${isPlus ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
        >
          Plan: {dbPlan.toUpperCase()}
        </span>
      </div>

      {/* PAYMENT METHOD SECTION */}
      <p className="text-slate-400 text-xs my-4">Payment Method</p>
      {/* PAYMENT METHOD SECTION */}
      <p className="text-slate-400 text-xs my-4">Payment Method</p>
      <div className="flex gap-2 items-center">
        <input
          className="cursor-pointer"
          type="radio"
          name="payment"
          checked={paymentMethod === "COD"}
          onChange={() => setPaymentMethod("COD")}
        />
        <label>Cash on Delivery (COD)</label>
      </div>
      <div className="flex gap-2 items-center mt-1">
        <input
          className="cursor-pointer"
          type="radio"
          name="payment"
          checked={paymentMethod === "PADDLE"} // "STRIPE" ko "PADDLE" se badal diya
          onChange={() => setPaymentMethod("PADDLE")}
        />
        <label>Online Payment (Paddle)</label>
      </div>

      {/* ADDRESS SECTION */}
      <div className="my-4 py-4 border-y border-slate-200 text-slate-400">
        <p>Address</p>
        {selectedAddress ? (
          <div className="flex gap-2 items-center">
            <p>
              {selectedAddress.name}, {selectedAddress.city},{" "}
              {selectedAddress.state}, {selectedAddress.zip}
            </p>
            <SquarePenIcon
              onClick={() => setSelectedAddress(null)}
              size={18}
              className="cursor-pointer"
            />
          </div>
        ) : (
          <div>
            {addressList.length > 0 && (
              <select
                className="border p-2 w-full my-3 rounded"
                onChange={(e) =>
                  setSelectedAddress(addressList[e.target.value])
                }
              >
                <option>Select Address</option>
                {addressList.map((a, i) => (
                  <option key={i} value={i}>
                    {a.name}, {a.city}, {a.state}, {a.zip}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowAddressModal(true)}
              className="flex items-center gap-1"
            >
              Add Address <PlusIcon size={18} />
            </button>
          </div>
        )}
      </div>

      {/* SUMMARY DETAILS */}
      <div className="pb-4 border-b">
        <div className="flex justify-between">
          <div className="text-slate-400">
            <p>Subtotal:</p>
            <p>Shipping:</p>
            {coupon && <p>Coupon ({coupon.code}):</p>}
          </div>
          <div className="text-right font-medium">
            <p>
              {currency}
              {Number(totalPrice).toFixed(2)} {/* Fixed decimal here */}
            </p>
            <p className={isPlus ? "text-green-600" : ""}>
              {isPlus ? "FREE" : `${currency}${shippingFee.toFixed(2)}`}
            </p>
            {coupon && (
              <p className="text-red-500">
                -{currency}
                {discountAmount.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* COUPON INPUT */}
      {!coupon ? (
        <form
          onSubmit={(e) =>
            toast.promise(handleCouponCode(e), { loading: "Checking..." })
          }
          className="flex gap-2 mt-3"
        >
          <input
            value={couponCodeInput}
            onChange={(e) => setCouponCodeInput(e.target.value)}
            placeholder="Coupon Code"
            className="border p-2 w-full rounded"
          />
          <button className="bg-slate-600 text-white px-3 rounded">
            Apply
          </button>
        </form>
      ) : (
        <div className="flex justify-between items-center bg-green-50 p-2 mt-2 rounded border border-green-200">
          <div>
            <p className="font-bold text-green-700 text-xs">{coupon.code}</p>
            <p className="text-[10px] text-green-600">{coupon.description}</p>
          </div>
          <XIcon
            onClick={() => setCoupon("")}
            size={16}
            className="text-green-700 cursor-pointer"
          />
        </div>
      )}

      {/* FINAL TOTAL */}
      <div className="flex justify-between py-4 text-lg">
        <p className="text-slate-600 font-bold">Total:</p>
        <p className="font-bold text-slate-800">
          {currency}
          {finalTotal.toFixed(2)}{" "}
          {/* Already had toFixed, but ensure it stays */}
        </p>
      </div>

      <button
        onClick={handlePlaceOrder}
        className="w-full bg-slate-700 hover:bg-slate-800 text-white py-3 rounded-xl transition-all"
      >
        Place Order
      </button>

      {showAddressModal && (
        <AddressModal setShowAddressModal={setShowAddressModal} />
      )}
    </div>
  );
};

export default OrderSummary;
