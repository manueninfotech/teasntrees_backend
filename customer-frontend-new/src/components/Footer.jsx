import React from 'react';
import { Link } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';
import { cn } from '../lib/utils';
import { MapPin, Phone, Mail, Coffee, Cake } from 'lucide-react';

export default function Footer() {
    const { brand, theme } = useBrand();

    return (
        <footer className={cn(
            "py-16 border-t mt-auto transition-colors duration-500",
            theme.isLittleH 
                ? "bg-[#565A47] border-[#8B8E7B]/20 text-[#FAF1E8]/70" 
                : "bg-[#052e16] border-emerald-900/40 text-emerald-100/70"
        )}>
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
                {/* Upper grid */}
                <div 
                    className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b transition-colors duration-500" 
                    style={{ borderColor: theme.isLittleH ? '#8B8E7B1A' : '#064e3b' }}
                >
                    
                    {/* Brand Info */}
                    <div className="md:col-span-4 space-y-4">
                        <div className="flex items-center gap-2">
                            {theme.isLittleH ? (
                                <Cake className="w-6 h-6 text-[#FAF1E8]" />
                            ) : (
                                <Coffee className="w-6 h-6 text-emerald-400" />
                            )}
                            <span className={cn(
                                "text-lg font-black uppercase tracking-[0.2em]",
                                theme.isLittleH ? "text-[#FAF1E8] font-playfair" : "text-emerald-50"
                            )}>
                                {theme.isLittleH ? "LittleH Patisserie" : "Teas N Trees"}
                            </span>
                        </div>
                        <p className={cn(
                            "text-xs leading-relaxed max-w-xs",
                            theme.isLittleH ? "text-[#FAF1E8]/70" : "text-emerald-200/60"
                        )}>
                            {theme.isTeasNTrees 
                                ? "Where nature meets your perfect cup. Experience curated teas, rich single-origin coffees, and dining in Guntur's finest garden sanctuary."
                                : "Indulge in artisanal pastries, custom wedding cakes, and neighborhood sweetness baked fresh long before sunrise daily."}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="md:col-span-2 space-y-4">
                        <h4 className={cn(
                            "text-xs font-black uppercase tracking-widest",
                            theme.isLittleH ? "text-[#FAF1E8] font-playfair" : "text-emerald-200"
                        )}>
                            Discover
                        </h4>
                        <ul className="space-y-2 text-xs font-semibold">
                            <li>
                                <Link to={`/${brand}/menu`} className={cn("transition-colors", theme.isLittleH ? "hover:text-white" : "hover:text-emerald-400")}>
                                    Our Menu
                                </Link>
                            </li>
                            <li>
                                <Link to={`/${brand}/about`} className={cn("transition-colors", theme.isLittleH ? "hover:text-white" : "hover:text-emerald-400")}>
                                    About Us
                                </Link>
                            </li>
                            {theme.isTeasNTrees && (
                                <li>
                                    <Link to={`/${brand}/seasonal`} className={cn("transition-colors", theme.isLittleH ? "hover:text-white" : "hover:text-emerald-400")}>
                                        Seasonal Specials
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Support & Legals */}
                    <div className="md:col-span-2 space-y-4">
                        <h4 className={cn(
                            "text-xs font-black uppercase tracking-widest",
                            theme.isLittleH ? "text-[#FAF1E8] font-playfair" : "text-emerald-200"
                        )}>
                            Support & Legal
                        </h4>
                        <ul className="space-y-2 text-xs font-semibold">
                            <li>
                                <Link to={`/${brand}/contact`} className={cn("transition-colors", theme.isLittleH ? "hover:text-white" : "hover:text-emerald-400")}>
                                    Contact Support
                                </Link>
                            </li>
                            <li>
                                <Link to={`/${brand}/privacy`} className={cn("transition-colors", theme.isLittleH ? "hover:text-white" : "hover:text-emerald-400")}>
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Direct Contact info */}
                    <div className="md:col-span-4 space-y-4">
                        <h4 className={cn(
                            "text-xs font-black uppercase tracking-widest",
                            theme.isLittleH ? "text-[#FAF1E8] font-playfair" : "text-emerald-200"
                        )}>
                            Get in Touch
                        </h4>
                        <ul className={cn(
                            "space-y-3 text-xs",
                            theme.isLittleH ? "text-[#FAF1E8]/70" : "text-emerald-200/60"
                        )}>
                            <li className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 shrink-0 opacity-70" />
                                <span>Laxmipuram, Guntur, Andhra Pradesh</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 shrink-0 opacity-70" />
                                <span>+91 72868 33999</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 shrink-0 opacity-70" />
                                <span>{theme.isLittleH ? "hello@littlehbakery.in" : "hello@teasntrees.in"}</span>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Lower metadata */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4 text-[10px] opacity-75 font-semibold">
                    <p>
                        © {new Date().getFullYear()} {theme.brandName}. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link to={`/${brand}/privacy`} className="hover:underline">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
