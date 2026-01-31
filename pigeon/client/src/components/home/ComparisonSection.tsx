import ComparisonCard from "./ComparisonCard";

export default function ComparisonSection() {
    return (
        <div className="space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-white text-3xl md:text-4xl font-bold tracking-[-0.02em]">
                    How Pigeon Compares
                </h2>
                <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                    See how we stack up against traditional messaging platforms.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ComparisonCard
                    title="WhatsApp"
                    subtitle="Centralized messenger by Meta"
                    icon="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                    gradient="bg-linear-to-br from-green-600/20 to-emerald-600/20"
                    features={[
                        {
                            feature: "E2E Encryption",
                            pigeon: true,
                            competitor: true,
                        },
                        {
                            feature: "Decentralized",
                            pigeon: true,
                            competitor: false,
                        },
                        {
                            feature: "No Metadata Collection",
                            pigeon: true,
                            competitor: false,
                        },
                        {
                            feature: "Open Source",
                            pigeon: true,
                            competitor: "Partial",
                        },
                        {
                            feature: "No Phone Number",
                            pigeon: true,
                            competitor: false,
                        },
                        {
                            feature: "Censorship Resistant",
                            pigeon: true,
                            competitor: false,
                        },
                    ]}
                />

                <ComparisonCard
                    title="Telegram"
                    subtitle="Cloud-based messenger"
                    icon="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
                    gradient="bg-linear-to-br from-blue-600/20 to-sky-600/20"
                    features={[
                        {
                            feature: "E2E Encryption",
                            pigeon: true,
                            competitor: "Secret Chats Only",
                        },
                        {
                            feature: "Decentralized",
                            pigeon: true,
                            competitor: false,
                        },
                        {
                            feature: "No Metadata Collection",
                            pigeon: true,
                            competitor: false,
                        },
                        {
                            feature: "Open Source",
                            pigeon: true,
                            competitor: "Client Only",
                        },
                        {
                            feature: "No Phone Number",
                            pigeon: true,
                            competitor: false,
                        },
                        {
                            feature: "Censorship Resistant",
                            pigeon: true,
                            competitor: false,
                        },
                    ]}
                />
            </div>
        </div>
    );
}
