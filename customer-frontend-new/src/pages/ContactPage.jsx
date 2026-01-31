import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send, Clock, Instagram, Facebook } from 'lucide-react';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate form submission
        setTimeout(() => {
            setIsSubmitted(true);
            setFormData({ name: '', email: '', message: '' });
        }, 1000);
    };

    const contactInfo = [
        {
            icon: Phone,
            title: "Phone",
            text: "+91 72868 33999",
            link: "tel:+917286833999",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            icon: Mail,
            title: "Email",
            text: "hello@teasntrees.in",
            link: "mailto:hello@teasntrees.in",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            icon: MapPin,
            title: "Location",
            text: "Laxmipuram, Guntur, Andhra Pradesh",
            link: "https://goo.gl/maps/TeasNTreesLink",
            color: "text-red-500",
            bg: "bg-red-50"
        }
    ];

    return (
        <div className="min-h-screen pt-24 pb-20 bg-slate-50">
            <div className="container mx-auto px-4 lg:px-8">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block bg-white px-6 py-2 rounded-full shadow-sm mb-6 text-cafe-emerald font-semibold"
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

                        {/* Social Media & Hours */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-cafe-emerald/5 p-8 rounded-3xl border border-cafe-emerald/10"
                        >
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-cafe-emerald" /> Opening Hours
                            </h3>
                            <ul className="space-y-3 mb-8">
                                <li className="flex justify-between text-sm">
                                    <span className="text-slate-500">Monday - Friday</span>
                                    <span className="font-bold text-slate-800">11:00 AM - 11:00 PM</span>
                                </li>
                                <li className="flex justify-between text-sm">
                                    <span className="text-slate-500">Saturday - Sunday</span>
                                    <span className="font-bold text-slate-800">10:00 AM - 11:30 PM</span>
                                </li>
                            </ul>

                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-pink-500 hover:shadow-md transition-all">
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-md transition-all">
                                    <Facebook className="w-5 h-5" />
                                </a>
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
                                        <label className="text-sm font-medium text-slate-700">Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cafe-emerald focus:ring-2 focus:ring-cafe-emerald/20 transition-all outline-none"
                                            placeholder="Your name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cafe-emerald focus:ring-2 focus:ring-cafe-emerald/20 transition-all outline-none"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Message</label>
                                    <textarea
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cafe-emerald focus:ring-2 focus:ring-cafe-emerald/20 transition-all outline-none resize-none"
                                        placeholder="How can we help you?"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" /> Send Message
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
