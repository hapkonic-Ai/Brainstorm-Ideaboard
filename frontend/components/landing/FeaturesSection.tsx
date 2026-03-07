import { motion } from 'framer-motion';
import { LayoutGrid, Share2, Zap, Shield } from 'lucide-react';

const features = [
    {
        icon: LayoutGrid,
        title: 'Visual Workspaces',
        description: 'Organize your ideas into beautiful, intuitive boards with drag-and-drop simplicity.',
    },
    {
        icon: Share2,
        title: 'Real-time Collaboration',
        description: 'Work together with your team synchronously. See changes instantly as they happen.',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Built on modern architecture ensuring your workspace is always responsive and fluid.',
    },
    {
        icon: Shield,
        title: 'Secure & Private',
        description: 'Enterprise-grade security keeps your brainstorming sessions and data completely safe.',
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export function FeaturesSection() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Everything you need to create</h2>
                    <p className="mt-4 text-xl text-gray-500">Powerful tools designed to stay out of your way.</p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-50px' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div key={index} variants={item} className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
