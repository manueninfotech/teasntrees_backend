import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send, Loader2, Instagram, Facebook, Twitter, Clock } from 'lucide-react';
import contactService from '../services/contactService';
import settingsService from '../services/settingsService';
import { useBrand } from '../context/BrandContext';

const ContactPage = () => {
    const { brand, theme } = useBrand();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await settingsService.getSettings();
                if (res.success) {
                    setSettings(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch contact settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const res = await contactService.submitContactForm(formData);
            if (res.success) {
                setIsSubmitted(true);
                setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
            }
        } catch (err) {
            setError(err || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactInfo = [
        {
            icon: Phone,
            title: "Phone",
            text: settings?.contactPhone || "+91 72868 33999",
            link: `tel:${settings?.contactPhone?.replace(/\s/g, '') || "+917286833999"}`,
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            icon: Mail,
            title: "Email",
            text: settings?.contactEmail || (theme.isTeasNTrees ? "hello@teasntrees.in" : "hello@littlehbakery.in"),
            link: `mailto:${settings?.contactEmail || (theme.isTeasNTrees ? "hello@teasntrees.in" : "hello@littlehbakery.in")}`,
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            icon: MapPin,
            title: "Location",
            text: settings?.address || "Laxmipuram, Guntur, Andhra Pradesh",
            link: "https://goo.gl/maps/TeasNTreesLink",
            color: "text-red-500",
            bg: "bg-red-50"
        }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen pt-24 pb-20 bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className={`w-10 h-10 ${theme.textColorClass} animate-spin`} />
                    <p className="text-slate-500 font-medium">Loading contact details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 bg-slate-50">
            <div className="container mx-auto px-4 lg:px-8">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`inline-block bg-white px-6 py-2 rounded-full shadow-sm mb-6 ${theme.textColorClass} font-semibold border ${theme.primaryColorClass.replace('bg-', 'border-')}/20`}
                    >
                        Get in Touch
                    </motion.div>
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">We'd Love to Hear from You</h1>
                    <p className="text-slate-500 text-lg">
                        Have a question about our menu, need to book a table, or just want to say hi?
                        Drop us a message below!
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

                    {/* Contact Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        {contactInfo.map((item, idx) => (
                            <motion.a
                                key={idx}
                                href={item.link}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-center gap-5 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <item.icon className={`w-6 h-6 ${item.color}`} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                                    <p className="text-slate-500 font-medium">{item.text}</p>
                                </div>
                            </motion.a>
                        ))}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className={`${theme.primaryColorClass.replace('bg-', 'bg-')}/5 p-8 rounded-3xl border ${theme.primaryColorClass.replace('bg-', 'border-')}/10`}
                        >
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Clock className={`w-5 h-5 ${theme.textColorClass}`} /> Opening Hours
                            </h3>
                            <ul className="space-y-3 mb-8">
                                {settings?.operatingHours ? (
                                    (() => {
                                        const openDay = Object.values(settings.operatingHours).find(d => d.isOpen);
                                        return openDay ? (
                                            <li className="flex justify-between text-sm">
                                                <span className="text-slate-500">Open Daily</span>
                                                <span className="font-bold text-slate-800">{openDay.open} - {openDay.close}</span>
                                            </li>
                                        ) : (
                                            <li className="text-sm text-slate-500">Temporarily Closed</li>
                                        );
                                    })()
                                ) : (
                                    <li className="flex justify-between text-sm">
                                        <span className="text-slate-500">Open Daily</span>
                                        <span className="font-bold text-slate-800">11:00 AM - 11:30 PM</span>
                                    </li>
                                )}
                            </ul>

                            <div className="flex gap-4">
                                {settings?.socialMedia?.instagram && (
                                    <a href={settings.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-pink-500 hover:shadow-md transition-all">
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                )}
                                {settings?.socialMedia?.facebook && (
                                    <a href={settings.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-md transition-all">
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                )}
                                {settings?.socialMedia?.twitter && (
                                    <a href={settings.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-sky-500 hover:shadow-md transition-all">
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-slate-100"
                    >
                        {isSubmitted ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                    <Send className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-4">Message Sent!</h2>
                                <p className="text-slate-500 max-w-sm mb-8">
                                    Thanks for reaching out. Our team will get back to you within 24 hours.
                                </p>
                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <h2 className="text-2xl font-bold text-slate-800 mb-8">Send us a Message</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name</label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            required
                                            className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${theme.primaryColor} focus:ring-2 focus:ring-${theme.primaryColor}/20 transition-all outline-none`}
                                            placeholder="John"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name</label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            required
                                            className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${theme.primaryColor} focus:ring-2 focus:ring-${theme.primaryColor}/20 transition-all outline-none`}
                                            placeholder="Doe"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${theme.primaryColor} focus:ring-2 focus:ring-${theme.primaryColor}/20 transition-all outline-none`}
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium text-slate-700">Subject</label>
                                    <select
                                        id="subject"
                                        required
                                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${theme.primaryColor} focus:ring-2 focus:ring-${theme.primaryColor}/20 transition-all outline-none bg-white`}
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    >
                                        <option value="" disabled>Select a subject</option>
                                        <option value="General Inquiry">General Inquiry</option>
                                        <option value="Reservation">Table Reservation</option>
                                        <option value="Event Booking">Event Booking</option>
                                        <option value="Feedback">Feedback</option>
                                        <option value="Support">Support</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium text-slate-700">Message</label>
                                    <textarea
                                        id="message"
                                        required
                                        rows={6}
                                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-${theme.primaryColor} focus:ring-2 focus:ring-${theme.primaryColor}/20 transition-all outline-none resize-none`}
                                        placeholder="How can we help you?"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" /> Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>

                {/* Map Section */}
                <div className="mt-16">
                    <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Find Us</h2>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 overflow-hidden"
                    >
                        <div className="w-full h-[500px] rounded-2xl overflow-hidden relative">
                            <iframe
                                src={theme.isTeasNTrees
                                    ? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3829.271512537432!2d80.4309655!3d16.309065399999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4a75d5803c1ad5%3A0x575d7ce7d4586540!2sTEAS%20N%20TREES!5e0!3m2!1sen!2sin!4v1758987737969!5m2!1sen!2sin"
                                    : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3829.271512537432!2d80.4309655!3d16.309065399999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4a75d5803c1ad5%3A0x575d7ce7d4586540!2sLittleH%20Bakery!5e0!3m2!1sen!2sin!4v1758987737970!5m2!1sen!2sin"
                                }
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full h-full"
                            ></iframe>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
