"use client";

import { PlusIcon, SquarePenIcon, XIcon } from "lucide-react";
import React, { useState } from "react";
import AddressModal from "./AddressModal";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

const OrderSummary = ({ totalPrice, items }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

  const router = useRouter();
  const { user } = useUser();

  const addressList = useSelector((state) => state.address.list);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [coupon, setCoupon] = useState("");

  // ✅ FIXED PLAN LOGIC (ONLY CHANGE)
  const plan = user?.publicMetadata?.plan?.toLowerCase() || "free";
  const isPlus = plan === "plus";

  console.log("USER PLAN:", plan);
  console.log("IS PLUS:", isPlus);

  // ✅ SHIPPING
  const shippingFee = isPlus ? 0 : 5;

  // ✅ TOTAL
  const finalTotal = coupon
    ? totalPrice - (coupon.discount / 100) * totalPrice + shippingFee
    : totalPrice + shippingFee;

  // COUPON APPLY
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

  // PLACE ORDER
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    router.push("/orders");
  };

  return (
    <div className="w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7">

      <h2 className="text-xl font-medium text-slate-600">
        Payment Summary
      </h2>

      {/* PAYMENT */}
      <p className="text-slate-400 text-xs my-4">Payment Method</p>

      <div className="flex gap-2 items-center">
        <input
          type="radio"
          checked={paymentMethod === "COD"}
          onChange={() => setPaymentMethod("COD")}
        />
        <label>COD</label>
      </div>

      <div className="flex gap-2 items-center mt-1">
        <input
          type="radio"
          checked={paymentMethod === "STRIPE"}
          onChange={() => setPaymentMethod("STRIPE")}
        />
        <label>Stripe</label>
      </div>

      {/* ADDRESS */}
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

      {/* SUMMARY */}
      <div className="pb-4 border-b">
        <div className="flex justify-between">
          <div className="text-slate-400">
            <p>Subtotal:</p>
            <p>Shipping:</p>
            {coupon && <p>Coupon:</p>}
          </div>

          <div className="text-right font-medium">
            <p>{currency}{totalPrice}</p>
            <p>{isPlus ? "Free" : `${currency}${shippingFee}`}</p>

            {coupon && (
              <p>
                -{currency}
                {(coupon.discount / 100 * totalPrice).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* COUPON */}
      {!coupon ? (
        <form
          onSubmit={(e) =>
            toast.promise(handleCouponCode(e), {
              loading: "Checking Coupon...",
            })
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
        <div className="flex items-center gap-2 mt-2 text-xs">
          <p>{coupon.code}</p>
          <p>{coupon.description}</p>
          <XIcon onClick={() => setCoupon("")} size={18} />
        </div>
      )}

      {/* TOTAL */}
      <div className="flex justify-between py-4">
        <p>Total:</p>
        <p className="font-medium">
          {currency}
          {finalTotal.toFixed(2)}
        </p>
      </div>

      <button
        onClick={handlePlaceOrder}
        className="w-full bg-slate-700 text-white py-2 rounded"
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