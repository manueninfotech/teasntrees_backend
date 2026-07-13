import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Mail, Phone, MapPin } from 'lucide-react';
import { useBrand } from '../context/BrandContext';
import { cn } from '../lib/utils';

export default function PrivacyPage() {
    const { brand } = useBrand();

    const isTeasTheme = brand === 'teasntrees';

    const tntPolicy = {
        title: "Teas N Trees Privacy Policy",
        lastUpdated: "July 13, 2026",
        intro: "Teas N Trees Cafe & Dining is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our cafe, order via our website, or interact with our services.",
        sections: [
            {
                id: "collection",
                title: "1. Information We Collect",
                icon: FileText,
                content: [
                    "Personal identification information: Name, email address, phone number, and physical delivery addresses.",
                    "Order information: Items purchased, special preparation instructions, totals, and payment choices.",
                    "Location coordinates: Temporary GPS coordinates obtained during checkout to verify delivery feasibility and calculate distance.",
                    "Live delivery tracking: Real-time location coordinates of riders assigned to your delivery, to provide live updates on the tracking map."
                ]
            },
            {
                id: "use",
                title: "2. How We Use Your Information",
                icon: Eye,
                content: [
                    "To fulfill and deliver your food and beverage orders safely.",
                    "To send verification OTP pins via Firebase authentication for account creation and secure login.",
                    "To notify you of order status updates (e.g., preparation, packaging, out-for-delivery) via socket events and push notifications.",
                    "To manage rider assignments and compute delivery zone constraints."
                ]
            },
            {
                id: "sharing",
                title: "3. Sharing of Information",
                icon: Lock,
                content: [
                    "Payment Providers: We securely transmit transaction amounts to Razorpay. We do not store raw card numbers or bank credentials on our servers.",
                    "Delivery Personnel: Assigned delivery riders are provided with your name, phone number, and address strictly for route navigation.",
                    "Legal Obligations: We may disclose details only if required by law to protect safety, prevent fraud, or comply with regulations."
                ]
            },
            {
                id: "security",
                title: "4. Data Security and Deactivation",
                icon: Shield,
                content: [
                    "Your personal data is encrypted in transit and stored securely on cloud-hosted databases.",
                    "You have the right to edit your profile details at any time through the customer dashboard.",
                    "If you wish to delete your account, we enforce checks to ensure no active orders are pending. You may request account deactivation directly from the support desk."
                ]
            }
        ]
    };

    const littleHPolicy = {
        title: "Little H Patisserie Privacy Policy",
        lastUpdated: "July 13, 2026",
        intro: "Little H Patisserie respects your privacy. This policy documents how our patisserie collecting system manages your personal data, custom cake preferences, and ordering records.",
        sections: [
            {
                id: "collection",
                title: "1. Collection of Patisserie Data",
                icon: FileText,
                content: [
                    "Customer Details: Name, email, mobile number, and addresses registered for baked goods delivery.",
                    "Bespoke Preferences: Custom cake details, lettering requests, flavor profiles, and design references uploaded.",
                    "Billing Info: Saved delivery addresses, billing coordinates, and transaction timestamps.",
                    "Rider Tracking: Temporary GPS tracking data linked to active rider delivery assignments."
                ]
            },
            {
                id: "use",
                title: "2. Processing Your Orders",
                icon: Eye,
                content: [
                    "To schedule bake times, manage fresh ingredient sourcing, and verify pickup schedules.",
                    "To verify phone details securely using Firebase OTP verifications.",
                    "To dispatch live delivery updates so you know when your fresh cakes are arriving.",
                    "To track analytical statistics (such as top-selling pastries and custom designs) to improve our menu."
                ]
            },
            {
                id: "sharing",
                title: "3. Secure Integrations",
                icon: Lock,
                content: [
                    "Secure Checkout: Payments are processed strictly via fully compliant partners (Razorpay).",
                    "Rider Dispatch: Store managers pass delivery location tokens and contact names to delivery riders to coordinate drop-offs.",
                    "No Third-Party Advertising: We do not sell or lease your sweet ordering history or personal profiles to external marketers."
                ]
            },
            {
                id: "security",
                title: "4. Your Control & Deactivation",
                icon: Shield,
                content: [
                    "All account records are stored securely with password hashes and authenticated API tokens.",
                    "You can update your patisserie account details directly via the Customer Profile settings.",
                    "To request account deletion or deactivate your patisserie log, contact the store manager at Amaravathi Road branch."
                ]
            }
        ]
    };

    const currentPolicy = isTeasTheme ? tntPolicy : littleHPolicy;

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className={cn(
            "min-h-screen pt-28 pb-24 font-sans antialiased transition-colors duration-500",
            isTeasTheme 
                ? "bg-slate-50/50 text-slate-700 selection:bg-emerald-600 selection:text-white" 
                : "bg-[#FAF1E8] text-[#565A47] selection:bg-[#565A47] selection:text-[#FAF1E8]"
        )}>
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
                
                {/* Executive Header */}
                <div className={cn(
                    "border-b pb-6 mb-12 transition-colors duration-500",
                    isTeasTheme ? "border-slate-200" : "border-[#8B8E7B]/20"
                )}>
                    <div className={cn("flex items-center gap-3 mb-1", isTeasTheme ? "text-slate-800" : "text-[#565A47]")}>
                        <Shield className="w-6 h-6 shrink-0" />
                        <h1 className={cn("text-2xl font-bold tracking-tight", !isTeasTheme && "font-playfair")}>Legal & Privacy Center</h1>
                    </div>
                    <p className={cn("text-xs", isTeasTheme ? "text-slate-500" : "text-[#8B8E7B]")}>
                        Official policy governing the digital ordering systems for {isTeasTheme ? "Teas N Trees Cafe" : "Little H Patisserie"}
                    </p>
                </div>

                {/* Two-Column Structured Document Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left Sticky Sidebar (Table of Contents & Quick Navigation) */}
                    <div className="lg:col-span-3 sticky top-28 space-y-6 hidden lg:block">
                        <div className={cn(
                            "border rounded-2xl p-6 shadow-sm transition-colors duration-500",
                            isTeasTheme ? "bg-white border-slate-200/80" : "bg-[#FDF5EC] border-[#8B8E7B]/20"
                        )}>
                            <h3 className={cn(
                                "text-xs font-bold uppercase tracking-widest mb-4",
                                isTeasTheme ? "text-slate-400" : "text-[#8B8E7B]/60"
                            )}>
                                Document Sections
                            </h3>
                            <ul className="space-y-3">
                                {currentPolicy.sections.map((sec) => (
                                    <li key={sec.id}>
                                        <button
                                            onClick={() => scrollToSection(sec.id)}
                                            className={cn(
                                                "text-left text-xs font-semibold transition-colors w-full flex items-center gap-2 group",
                                                isTeasTheme ? "text-slate-600 hover:text-emerald-700" : "text-[#565A47] hover:text-[#8B8E7B]"
                                            )}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 transition-colors shrink-0" />
                                            {sec.title.substring(3)}
                                        </button>
                                    </li>
                                ))}
                                <li>
                                    <button
                                        onClick={() => scrollToSection("contact")}
                                        className={cn(
                                            "text-left text-xs font-semibold transition-colors w-full flex items-center gap-2 group",
                                            isTeasTheme ? "text-slate-600 hover:text-emerald-700" : "text-[#565A47] hover:text-[#8B8E7B]"
                                        )}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 transition-colors shrink-0" />
                                        Support Contact
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className={cn(
                            "p-5 rounded-2xl border text-[10px] space-y-1.5 transition-colors duration-500",
                            isTeasTheme ? "bg-slate-100 border-slate-200/60 text-slate-500" : "bg-[#FDF5EC] border-[#8B8E7B]/20 text-[#8B8E7B]"
                        )}>
                            <p className="font-bold uppercase tracking-wider">Compliance Info</p>
                            <p>Last Modified: {currentPolicy.lastUpdated}</p>
                            <p>Data Hosting: Secure Cloud Databases</p>
                            <p>Payment Security: Razorpay API Interface</p>
                        </div>
                    </div>

                    {/* Right Main Document Sheet */}
                    <div className="lg:col-span-9 space-y-8">
                        <motion.div
                            key={brand}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                                "border rounded-3xl p-8 lg:p-12 shadow-sm space-y-10 transition-colors duration-500",
                                isTeasTheme ? "bg-white border-slate-200/80" : "bg-[#FDF5EC] border-[#8B8E7B]/20"
                            )}
                        >
                            {/* Document Title Header */}
                            <div className={cn("border-b pb-8 transition-colors duration-500", isTeasTheme ? "border-slate-100" : "border-[#8B8E7B]/10")}>
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md",
                                    isTeasTheme ? "bg-emerald-50 text-emerald-700" : "bg-[#FAF1E8] text-[#565A47]"
                                )}>
                                    Official Legal Document
                                </span>
                                <h2 className={cn(
                                    "text-3xl font-bold tracking-tight mt-4",
                                    isTeasTheme ? "text-slate-800" : "text-[#565A47] font-playfair"
                                )}>
                                    {currentPolicy.title}
                                </h2>
                                <p className={cn("text-xs mt-2", isTeasTheme ? "text-slate-500" : "text-[#8B8E7B]")}>
                                    Effective Date: {currentPolicy.lastUpdated}
                                </p>
                                <p className={cn(
                                    "text-sm leading-relaxed mt-6 italic",
                                    isTeasTheme ? "text-slate-600" : "text-[#8B8E7B]"
                                )}>
                                    {currentPolicy.intro}
                                </p>
                            </div>

                            {/* Dynamic Content Sections */}
                            <div className="space-y-12">
                                {currentPolicy.sections.map((section) => {
                                    const IconComponent = section.icon;
                                    return (
                                        <div key={section.id} id={section.id} className="space-y-4 scroll-mt-32">
                                            <h3 className={cn(
                                                "text-base font-bold flex items-center gap-3",
                                                isTeasTheme ? "text-slate-800" : "text-[#565A47] font-playfair"
                                            )}>
                                                <span className={cn(
                                                    "p-2 rounded-lg border transition-colors duration-500",
                                                    isTeasTheme ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-[#FAF1E8] border-[#8B8E7B]/25 text-[#565A47]"
                                                )}>
                                                    <IconComponent className="w-4 h-4" />
                                                </span>
                                                {section.title}
                                            </h3>
                                            <ul className={cn(
                                                "space-y-3.5 pl-12 list-disc list-outside text-xs md:text-sm leading-relaxed",
                                                isTeasTheme ? "text-slate-600" : "text-[#8B8E7B]"
                                            )}>
                                                {section.content.map((point, pIdx) => (
                                                    <li key={pIdx}>
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Clean Document Signoff / Contact Block */}
                            <div id="contact" className={cn("border-t pt-10 space-y-6 scroll-mt-32 transition-colors duration-500", isTeasTheme ? "border-slate-100" : "border-[#8B8E7B]/10")}>
                                <div>
                                    <h4 className={cn("text-sm font-bold uppercase tracking-wider", isTeasTheme ? "text-slate-800" : "text-[#565A47] font-playfair")}>
                                        5. Privacy Support & Contact
                                    </h4>
                                    <p className={cn("text-xs mt-1", isTeasTheme ? "text-slate-500" : "text-[#8B8E7B]")}>
                                        For requests regarding data access, deactivation, or updating profile logs:
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                    <div className={cn(
                                        "flex items-start gap-3 p-4 rounded-xl border transition-colors duration-500",
                                        isTeasTheme ? "bg-slate-50 border-slate-200/40" : "bg-[#FAF1E8] border-[#8B8E7B]/25"
                                    )}>
                                        <Mail className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Helpdesk</p>
                                            <p className="text-xs font-semibold mt-1">
                                                {isTeasTheme ? "hello@teasntrees.in" : "hello@littlehbakery.in"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "flex items-start gap-3 p-4 rounded-xl border transition-colors duration-500",
                                        isTeasTheme ? "bg-slate-50 border-slate-200/40" : "bg-[#FAF1E8] border-[#8B8E7B]/25"
                                    )}>
                                        <Phone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Support</p>
                                            <p className="text-xs font-semibold mt-1">
                                                +91 72868 33999
                                            </p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "flex items-start gap-3 p-4 rounded-xl border transition-colors duration-500",
                                        isTeasTheme ? "bg-slate-50 border-slate-200/40" : "bg-[#FAF1E8] border-[#8B8E7B]/25"
                                    )}>
                                        <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                                            <p className="text-xs font-semibold mt-1">
                                                Laxmipuram, Guntur, AP
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    </div>

                </div>

            </div>
        </div>
    );
}
