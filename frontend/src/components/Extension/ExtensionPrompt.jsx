import { useState, useEffect } from "react";
import { Globe, Download, CheckCircle2, ShieldCheck, Zap, Copy, Check, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ExtensionPrompt() {
  const { token } = useAuth();
  const [step, setStep] = useState(1); // 1: Install, 2: Connect, 3: Connected
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if user previously connected extension
    const savedStatus = localStorage.getItem("extension_connected");
    if (savedStatus === "true") {
      setStep(3);
    }
  }, []);

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success("Connection token copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleConnectExtension = () => {
  setIsConnecting(true);

  const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID;

  if (!EXTENSION_ID) {
    toast.error("Extension ID is not configured.");
    setIsConnecting(false);
    return;
  }

  if (!token) {
    toast.error("You are not logged in.");
    setIsConnecting(false);
    return;
  }

  if (
    !window.chrome ||
    !window.chrome.runtime ||
    !window.chrome.runtime.sendMessage
  ) {
    toast.error("Chrome extension is not installed.");
    setIsConnecting(false);
    return;
  }

  window.chrome.runtime.sendMessage(
    EXTENSION_ID,
    {
      action: "SET_TOKEN",
      token: token,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Extension connection error:",
          chrome.runtime.lastError.message
        );

        toast.error("Extension not installed or unavailable.");
        setIsConnecting(false);
        return;
      }

      if (response?.success) {
        localStorage.setItem("extension_connected", "true");
        setStep(3);

        toast.success(
          "Extension connected successfully!"
        );
      } else {
        toast.error("Failed to connect extension.");
      }

      setIsConnecting(false);
    }
  );
};

  const handleDisconnect = () => {
    localStorage.removeItem("extension_connected");
    setStep(1);
    toast("Extension disconnected", { icon: "🔌" });
  };

  if (step === 3) {
    return (
      <div className="mb-8 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">Chrome Extension Connected</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Tracking
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Your browser learning activities are automatically analyzed and synced to your dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={handleDisconnect}
              className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/70 via-white to-red-50/40 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Enable Automatic Activity Tracking
            </h3>
            <p className="mt-1 text-sm text-gray-600 max-w-2xl">
              Install the Chrome Extension to capture your reading sessions, documentation visits, and tutorials automatically.
            </p>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {step === 1 && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  window.location.href = "/ailis-extension.zip";
                  setStep(2);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 transition"
              >
                <Download size={16} />
                Install Chrome Extension
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleConnectExtension}
                disabled={isConnecting}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 transition disabled:opacity-50"
              >
                <Zap size={16} className={isConnecting ? "animate-spin" : ""} />
                {isConnecting ? "Connecting..." : "Connect Extension"}
              </button>

              <button
                onClick={handleCopyToken}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy Token"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connection Steps Indicator */}
      <div className="mt-6 flex items-center gap-6 border-t border-red-100/80 pt-4 text-xs font-medium text-gray-500">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-red-600 font-semibold" : ""}`}>
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step >= 1 ? "bg-red-600 text-white" : "bg-gray-200 text-gray-600"}`}>1</span>
          Install Extension
        </div>

        <div className="h-px w-8 bg-gray-200" />

        <div className={`flex items-center gap-2 ${step >= 2 ? "text-red-600 font-semibold" : ""}`}>
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step >= 2 ? "bg-red-600 text-white" : "bg-gray-200 text-gray-600"}`}>2</span>
          Grant Permissions & Connect
        </div>

        <div className="h-px w-8 bg-gray-200" />

        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[11px] text-gray-600">3</span>
          Automatic Tracking Active
        </div>
      </div>
    </div>
  );
}
