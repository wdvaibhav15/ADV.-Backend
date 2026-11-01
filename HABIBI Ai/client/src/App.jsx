
import React, { useState, useEffect, useRef } from "react";

const API_URL = "http://localhost:3000/api/ai";

const App = () => {
    const [input, setInput] = useState("");

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hello! I am HABIBI AI. How can I help you today?"
        }
    ]);

    const [loading, setLoading] = useState(false);

    // Unique conversation ID for LangGraph memory
    const [threadId, setThreadId] = useState(() =>
        localStorage.getItem("habibi-thread-id") ||
        crypto.randomUUID()
    );

    const chatEndRef = useRef(null);

    useEffect(() => {
        localStorage.setItem("habibi-thread-id", threadId);
    }, [threadId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, loading]);

    // Send message to backend
    const handleSend = async (e) => {
        e.preventDefault();

        const userInput = input.trim();

        if (!userInput || loading) return;

        // Show user's message immediately
        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: userInput
            }
        ]);

        setInput("");
        setLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    input: userInput,
                    threadId: threadId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Something went wrong"
                );
            }

            // Handle the AI response
            const aiContent = data.AI;

            const aiResponse =
                typeof aiContent === "string"
                    ? aiContent
                    : Array.isArray(aiContent)
                        ? aiContent.map(item =>
                            typeof item === "string"
                                ? item
                                : item.text || ""
                          ).join("\n")
                        : String(aiContent ?? "No response received.");

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: aiResponse
                }
            ]);

        } catch (error) {
            console.error("Chat API Error:", error);

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Error: ${error.message}`
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Start a fresh conversation with new memory
    const handleNewChat = () => {
        setMessages([]);
        setInput("");

        const newThreadId = crypto.randomUUID();
        setThreadId(newThreadId);
    };

    return (
        <div className="flex h-screen w-full bg-[#212121] text-white">

            {/* Sidebar */}
            <aside className="hidden md:flex w-64 bg-[#171717] p-5 flex-col shrink-0">

                <h2 className="text-xl font-bold tracking-wide mb-8">
                    ✦ HABIBI AI
                </h2>

                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-3 border border-gray-700
                    hover:bg-[#292929] rounded-xl px-4 py-3 text-sm transition"
                >
                    <span className="text-xl">+</span>
                    New Chat
                </button>

                <div className="mt-auto border-t border-gray-800 pt-5">
                    <p className="text-sm font-medium">AI Assistant</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Powered by LangChain
                    </p>
                </div>

            </aside>

            {/* Main Chat */}
            <main className="flex flex-col flex-1 min-w-0">

                {/* Header */}
                <header className="h-16 border-b border-gray-800 flex
                items-center justify-between px-5 md:px-8 shrink-0">

                    <h3 className="font-medium text-lg">
                        HABIBI AI
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Online
                    </div>

                </header>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-32 py-8">

                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center
                        justify-center text-center">

                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10
                            flex items-center justify-center text-4xl
                            text-emerald-400 mb-6">
                                ✦
                            </div>

                            <h1 className="text-2xl md:text-3xl font-semibold mb-3">
                                How can I help you?
                            </h1>

                            <p className="text-gray-400 text-sm">
                                Ask me anything. Let's get started!
                            </p>

                        </div>
                    )}

                    {/* Messages */}
                    <div className="max-w-4xl mx-auto space-y-8">

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-3 ${
                                    msg.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >

                                {msg.role === "assistant" && (
                                    <div className="w-9 h-9 shrink-0 rounded-full
                                    bg-emerald-600 flex items-center justify-center">
                                        ✦
                                    </div>
                                )}

                                <div
                                    className={`max-w-[85%] md:max-w-[75%]
                                    px-4 py-3 rounded-2xl text-sm leading-7
                                    whitespace-pre-wrap break-words ${
                                        msg.role === "user"
                                            ? "bg-[#343434] rounded-tr-sm"
                                            : "bg-transparent"
                                    }`}
                                >
                                    {msg.content}
                                </div>

                                {msg.role === "user" && (
                                    <div className="w-9 h-9 shrink-0 rounded-full
                                    bg-gray-600 flex items-center justify-center
                                    text-sm font-semibold">
                                        U
                                    </div>
                                )}

                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-full
                                bg-emerald-600 flex items-center justify-center">
                                    ✦
                                </div>

                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <span>Habibi is thinking</span>
                                    <span className="animate-pulse">●●●</span>
                                </div>

                            </div>
                        )}

                        <div ref={chatEndRef}></div>

                    </div>
                </div>

                {/* Input Section */}
                <div className="px-4 md:px-12 lg:px-32 pb-5 pt-3">

                    <div className="max-w-4xl mx-auto">

                        <form
                            onSubmit={handleSend}
                            className="flex items-end gap-3 bg-[#303030]
                            border border-gray-700 rounded-2xl
                            px-4 py-3 focus-within:border-gray-500
                            transition"
                        >

                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder="Message HABIBI AI..."
                                rows={1}
                                className="flex-1 bg-transparent outline-none
                                resize-none text-white placeholder-gray-500
                                text-sm py-2 max-h-36 overflow-y-auto"
                            />

                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="w-10 h-10 shrink-0 rounded-full
                                bg-emerald-600 hover:bg-emerald-500
                                disabled:bg-gray-600 disabled:cursor-not-allowed
                                flex items-center justify-center
                                text-xl font-bold transition"
                            >
                                ↑
                            </button>

                        </form>

                        <p className="text-center text-gray-500 text-[11px] mt-3">
                            HABIBI AI can make mistakes. Verify important information.
                        </p>

                    </div>
                </div>

            </main>
        </div>
    );
};

export default App;
