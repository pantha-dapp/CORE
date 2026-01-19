import clsx from "clsx";
import { useState } from "react";
import Button from "../../shared/components/Button";
import Icon from "../../shared/components/Icon";

const SLIDES = [
    // ----------- Interest & Intent -----------
    {
        id: "tcp",
        question: "What do you want to learn?",
        options: [
            "Data Analytics",
            "Web Development",
            "Artificial Intelligence",
            "Cloud & DevOps",
            "Blockchain",
            "SQL & Databases",
            "Just exploring",
            "python",
            "javascript",
            "react",
            "nodejs",
        ],
    },
    {
        id: "intent",
        question: "Why do you want to learn this?",
        options: [
            "For my career",
            "For college / studies",
            "To switch jobs",
            "Personal interest",
            "Just exploring",
        ],
    },

    // ----------- Core CS Knowledge -----------
    {
        id: "udp",
        question: "What does TCP stand for?",
        options: [
            "Transmission Control Protocol",
            "Transfer Communication Process",
            "Technical Control Program",
            "Transport Core Protocol",
        ],
        correct: "Transmission Control Protocol",
    },
    {
        id: "ip",
        question: "Which protocol is connectionless?",
        options: ["TCP", "UDP", "HTTP", "FTP"],
        correct: "UDP",
    },
    {
        id: "ip_address",
        question: "What is an IP address used for?",
        options: [
            "To identify a device on a network",
            "To store files",
            "To encrypt data",
            "To design websites",
        ],
        correct: "To identify a device on a network",
    },

    // ----------- Web Basics -----------
    {
        id: "http_method",
        question: "Which HTTP method is used to fetch data?",
        options: ["POST", "PUT", "GET", "DELETE"],
        correct: "GET",
    },
    {
        id: "html",
        question: "What does HTML stand for?",
        options: [
            "HyperText Markup Language",
            "HighText Machine Language",
            "Hyper Transfer Markup Logic",
            "Host Text Markup Language",
        ],
        correct: "HyperText Markup Language",
    },

    // ----------- Databases -----------
    {
        id: "sql",
        question: "Which SQL command is used to retrieve data?",
        options: ["INSERT", "UPDATE", "SELECT", "DELETE"],
        correct: "SELECT",
    },
    {
        id: "primary_key",
        question: "True or False: A primary key can have duplicate values.",
        options: ["True", "False"],
        correct: "False",
    },

    // ----------- Final -----------
    {
        id: "ready",
        question: "Ready to start your learning journey?",
        options: ["Yes, let's go 🚀"],
    },
];

const calculateScore = (
    slides: typeof SLIDES,
    answers: Record<number, string>,
) => {
    let score = 0;
    let total = 0;

    slides.forEach((slide, index) => {
        if ("correct" in slide) {
            total++;
            if (answers[index] === slide.correct) {
                score++;
            }
        }
    });

    return { score, total };
};

const getUserLevel = (score: number, total: number) => {
    const percent = (score / total) * 100;

    if (percent < 40) return "Beginner";
    if (percent < 75) return "Intermediate";
    return "Advanced";
};

export default function Onboarding() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    //const currentSlide = SLIDES[step];

    const selectOption = (value: string) => {
        setAnswers((prev) => ({
            ...prev,
            [step]: value,
        }));
    };

    if (step === SLIDES.length) {
        const { score, total } = calculateScore(SLIDES, answers);
        const level = getUserLevel(score, total);

        return (
            <div className="h-screen bg-gray-900 text-white overflow-hidden flex flex-col px-4 py-6">
                <h1 className="text-3xl font-bold mb-4">You're all set 🎉</h1>

                <p className="text-lg mb-2">
                    You answered <span className="font-semibold">{score}</span> out of{" "}
                    <span className="font-semibold">{total}</span> questions correctly
                </p>

                <div className="mt-4 px-6 py-3 rounded-xl bg-green-600 text-xl font-bold">
                    Level: {level}
                </div>

                <p className="mt-6 text-gray-400 max-w-md">
                    We’ll personalize your learning path based on your answers.
                </p>

                <Button
                    type="button"
                    fullWidth
                    size="lg"
                    className="mt-8"
                    onClick={() => {
                        console.log("FINAL RESULT", { answers, score, total, level });
                        // redirect to dashboard later
                    }}
                >
                    Start Learning 🚀
                </Button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 text-white overflow-hidden flex flex-col px-4 py-6">
            {/* HEADER */}
            {/* PROGRESS BAR */}
            <div className="mb-4">
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-300 ease-out"
                        style={{
                            width: `${((step + 1) / SLIDES.length) * 100}%`,
                        }}
                    />
                </div>
            </div>

            {/* HEADER */}
            <div className="flex items-center mb-4">
                {step > 0 && (
                    <button
                        type="button"
                        onClick={() => setStep((s) => s - 1)}
                        className="p-2 rounded-full hover:bg-gray-800"
                    >
                        <Icon name="arrow-left" size={22} />
                    </button>
                )}
                <span className="ml-auto text-sm text-gray-400">
                    {step + 1} / {SLIDES.length}
                </span>
            </div>

            {/* SLIDER */}
            <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden px-4 py-6">
                {/* HEADER / PROGRESS / BACK BUTTON stays fixed above */}

                {/* SLIDER CONTAINER */}
                <div className="flex-1 overflow-hidden h-full">
                    <div
                        className="flex h-full transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${step * 100}%)` }}
                    >
                        {SLIDES.map((slide) => (
                            <div
                                key={slide.id}
                                className="w-full flex-shrink-0 flex flex-col h-full px-1"
                            >
                                {/* QUESTION (FIXED) */}
                                <h1 className="text-3xl font-bold mb-4 text-center shrink-0">
                                    {slide.question}
                                </h1>

                                {/* OPTIONS (SCROLLABLE) */}
                                <div className="flex-1 overflow-y-auto space-y-3 pb-4 mt-3">
                                    {slide.options.map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => selectOption(option)}
                                            className={clsx(
                                                "w-full rounded-xl px-4 py-4 text-left border transition-all active:scale-[0.98]",
                                                answers[index] === option
                                                    ? "bg-green-600 border-green-400"
                                                    : "bg-gray-800 border-gray-700 hover:bg-gray-700",
                                            )}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CONTINUE BUTTON stays fixed below */}
            </div>

            {/* CONTINUE */}
            <Button
                fullWidth
                size="lg"
                type="button"
                variant="primary"
                disabled={!answers[step]}
                onClick={() => {
                    if (step < SLIDES.length - 1) {
                        setStep((s) => s + 1);
                    } else {
                        setStep(SLIDES.length); // go to summary screen
                    }
                }}
            >
                {step === SLIDES.length - 1 ? "Finish" : "Continue"}
            </Button>
        </div>
    );
}
