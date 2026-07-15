"use client";

import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

interface ActionModalProps {
  isOpen: boolean;
  type: "alert" | "confirm" | "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}

export default function ActionModal({ 
  isOpen, 
  type, 
  title, 
  message, 
  onClose, 
  onConfirm,
  confirmText = "Confirm"
}: ActionModalProps) {
  if (!isOpen) return null;

  const isConfirm = type === "confirm";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#011B51]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            {type === "confirm" && <HelpCircle className="w-6 h-6 text-[#FED702]" />}
            {type === "error" && <AlertCircle className="w-6 h-6 text-rose-500" />}
            {type === "success" && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
            {type === "alert" && <AlertCircle className="w-6 h-6 text-amber-500" />}
            
            <h3 className="text-lg font-black text-[#011B51] uppercase tracking-tight leading-none pt-1">
              {title}
            </h3>
          </div>
          <p className="text-slate-600 text-sm font-medium">
            {message}
          </p>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          {isConfirm && (
            <button 
              onClick={onClose} 
              className="px-4 py-2.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={() => {
              if (isConfirm && onConfirm) {
                onConfirm();
              } else {
                onClose();
              }
            }} 
            className={`px-5 py-2.5 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-sm border-b-2 ${
              type === "error" 
                ? "bg-rose-600 hover:bg-rose-700 border-rose-800" 
                : "bg-[#011B51] hover:bg-[#022a7a] border-[#A51A21]"
            }`}
          >
            {isConfirm ? confirmText : "Okay"}
          </button>
        </div>

      </div>
    </div>
  );
}