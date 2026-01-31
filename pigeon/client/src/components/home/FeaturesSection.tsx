import FeatureCard from "./FeatureCard";

const features = [
    {
        icon: "lock",
        title: "Decentralized & Secure",
        description: "End-to-end encrypted messaging with no central servers. Your data is your own.",
        gradient: "bg-linear-to-br from-violet-600/10 to-purple-600/10",
    },
    {
        icon: "bolt",
        title: "Lightning Fast",
        description: "Leveraging the high-speed Solana network for instant message delivery.",
        gradient: "bg-linear-to-br from-blue-600/10 to-indigo-600/10",
    },
    {
        icon: "groups",
        title: "Community Owned",
        description: "A protocol governed by its users, ensuring a censorship-resistant platform.",
        gradient: "bg-linear-to-br from-purple-600/10 to-pink-600/10",
    },
];

export default function FeaturesSection() {
    return (
        <div className="space-y-12">
            <div className="text-center space-y-4 fade-in-up stagger-2">
                <h2 className="text-white text-3xl md:text-4xl font-bold tracking-[-0.02em]">
                    Why Choose Pigeon?
                </h2>
                <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                    Built on cutting-edge technology to ensure your conversations stay private and fast.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-up stagger-3">
                {features.map((feature, index) => (
                    <FeatureCard key={index} {...feature} />
                ))}
            </div>
        </div>
    );
}
