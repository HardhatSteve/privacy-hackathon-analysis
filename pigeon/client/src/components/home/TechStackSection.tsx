
const techStack = [
    {
        name: "Solana",
        logo: "https://images.seeklogo.com/logo-png/42/2/solana-sol-logo-png_seeklogo-423095.png"
    },
    {
        name: "Anchor",
        logo: "https://camo.githubusercontent.com/590ccfb4e70a27673047ee879ed409981c05b2da403e60b4aaa7961ccdb46001/68747470733a2f2f7062732e7477696d672e636f6d2f6d656469612f46565556614f3958454141756c764b3f666f726d61743d706e67266e616d653d736d616c6c"
    },
    {
        name: "React",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg"
    },
    {
        name: "TypeScript",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg"
    },
    {
        name: "Vite",
        logo: "https://vitejs.dev/logo.svg"
    },
    {
        name: "Tailwind",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg"
    },
    {
        name: "WebSocket",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg"
    },
];

export default function TechStackSection() {
    return (
        <div className="space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-white text-3xl md:text-4xl font-bold tracking-[-0.02em]">
                    Built With Modern Tech
                </h2>
                <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                    Leveraging the best tools and libraries to deliver a secure, fast experience.
                </p>
            </div>

            <div className="flex flex-wrap md:flex-nowrap justify-center gap-3 md:gap-4 overflow-x-auto">
                {techStack.map((tech, index) => (
                    <div
                        key={index}
                        className="tech-badge px-5 py-3 rounded-xl flex items-center gap-3 whitespace-nowrap"
                    >
                        <img
                            src={tech.logo}
                            alt={tech.name}
                            className="w-6 h-6 object-contain"
                        />
                        <span className="text-white font-semibold text-sm tracking-[-0.01em]">
                            {tech.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
