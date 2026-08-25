import { useEffect, useState } from "react";
import { useParams } from "@/lib/router";
import { Printer } from "lucide-react";
import { apiFetch, LOGO_URL } from "@/lib/api";
function money(v) { return Number(v || 0).toLocaleString("ru-RU"); }
const METHODS = { cash: "Naqd", card: "Karta", transfer: "O'tkazma" };
export default function ReceiptPage() {
    const params = useParams();
    const id = params?.id;
    const [p, setP] = useState(null);
    const [brand, setBrand] = useState({ name: "Robocode CRM", logo: "" });
    const [err, setErr] = useState(false);
    useEffect(() => {
        if (!id)
            return;
        apiFetch(`/api/payments/${id}`).then(r => r.ok ? r.json() : Promise.reject()).then(setP).catch(() => setErr(true));
        apiFetch("/api/branding").then(r => r.json()).then(setBrand).catch(() => { });
    }, [id]);
    if (err)
        return <div className="p-10 text-center text-gray-400">To&apos;lov topilmadi</div>;
    if (!p)
        return <div className="p-10 text-center text-gray-400">Yuklanmoqda...</div>;
    const receiptNo = (p.id || "").slice(-8).toUpperCase();
    const row = (label, value) => (<div className="flex justify-between gap-3 py-1.5 text-[13px]">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>);
    return (<div className="min-h-screen bg-[#F5F6FA] flex flex-col items-center py-10 px-4 print:bg-white print:py-0" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mb-5 flex gap-2 print:hidden">
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-5 py-2.5 bg-[#5E2CA5] hover:bg-[#4a2280] text-white text-[13px] font-semibold rounded-xl shadow-sm transition-colors">
          <Printer className="w-4 h-4"/> Chop etish
        </button>
        <button onClick={() => window.close()} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 text-[13px] font-medium rounded-xl hover:bg-gray-50 transition-colors">
          Yopish
        </button>
      </div>

      <div id="receipt" className="bg-white w-[340px] p-7 rounded-2xl shadow-lg print:shadow-none print:w-full print:max-w-[340px]">
        <div className="text-center mb-5">
          <div className="inline-flex w-16 h-16 rounded-full bg-[#5E2CA5] items-center justify-center mb-3 overflow-hidden">
            <img src={brand.logo || LOGO_URL} alt="" className="w-full h-full object-contain"/>
          </div>
          <h1 className="text-[17px] font-bold text-gray-900">{brand.name}</h1>
          <p className="text-[11px] font-semibold text-[#5E2CA5] tracking-widest mt-1">TO&apos;LOV CHEKI</p>
        </div>

        <div className="border-t border-dashed border-gray-300"/>

        <div className="py-2">
          {row("Chek raqami", `#${receiptNo}`)}
          {row("Sana", new Date(p.paidAt).toLocaleDateString("ru-RU"))}
          {row("O'quvchi", p.lead?.fullName || "—")}
          {p.courseName && row("Kurs", p.courseName)}
          {row("To'lov turi", METHODS[p.method] || p.method)}
          {p.forMonth && row("Davr", p.forMonth)}
          {p.discount && Number(p.discount) > 0 ? row("Chegirma", `${money(p.discount)} so'm`) : null}
        </div>

        <div className="border-t border-dashed border-gray-300"/>

        <div className="text-center py-4">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Jami to&apos;lov</p>
          <p className="text-[28px] font-bold text-[#5E2CA5] leading-tight">{money(p.amount)} so&apos;m</p>
        </div>

        <div className="border-t border-dashed border-gray-300"/>

        <p className="text-[11px] text-gray-400 text-center mt-3">Qabul qildi: {p.createdBy?.fullName || "—"}</p>
        <p className="text-center text-[13px] font-semibold text-[#5E2CA5] mt-3">Rahmat! 🟣</p>
      </div>

      <style>{`
        @media print {
          @page { margin: 10mm; }
          body { background: #fff !important; }
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { position: absolute; top: 0; left: 0; }
        }
      `}</style>
    </div>);
}
