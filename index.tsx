/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";

declare const Chart: any;
declare const L: any;

// Polyfill for SpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// Report type definition, moved to top level for global access
interface Report {
    id: number;
    type: 'Voice' | 'Live Video';
    timestamp: string;
    analysis: {
        category: string;
        summary: string;
        tone?: string;
        movement_analysis?: string;
    };
    transcript?: string;
    location?: string;
    imageBase64?: string;
}

// Helper functions for localStorage-based report history
const getReportsFromStorage = (): Report[] => {
    try {
        const saved = localStorage.getItem('reportsHistory');
        const reports = saved ? JSON.parse(saved) : [];
        // Sort by timestamp descending (newest first)
        return reports.sort((a: Report, b: Report) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error("Could not parse reports from localStorage", error);
        return [];
    }
};

const saveReportToStorage = (reportData: Omit<Report, 'id' | 'timestamp'>): Report => {
    // Get currently stored reports, but unsorted to just append.
    const saved = localStorage.getItem('reportsHistory');
    const reports = saved ? JSON.parse(saved) : [];
    const newReport: Report = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...reportData
    };
    reports.push(newReport);
    localStorage.setItem('reportsHistory', JSON.stringify(reports));
    return newReport;
};

const clearReportsFromStorage = () => {
    localStorage.removeItem('reportsHistory');
};


const App = () => {
    const [page, setPage] = useState('home');
    const [ai, setAi] = useState<GoogleGenAI | null>(null);

    useEffect(() => {
        try {
            const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
            setAi(genAI);
        } catch (e) {
            console.error(e);
            alert("Error initializing AI. Make sure API_KEY is set.");
        }
    }, []);

    const renderPage = () => {
        if (!ai) {
             return (
                <div className="d-flex justify-content-center align-items-center vh-100">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            );
        }
        switch (page) {
            case 'live-report':
                return <LiveReportPage ai={ai} />;
            case 'voice-report':
                return <VoiceReportPage ai={ai} />;
            case 'chat':
                return <AIChatPage ai={ai} />;
            case 'study-buddy':
                return <StudyBuddyPage ai={ai} />;
            case 'journal':
                return <JournalPage />;
            case 'about':
                return <AboutPage />;
            case 'contacts':
                return <EmergencyContactsPage />;
            case 'history':
                return <HistoryPage />;
            case 'home':
            default:
                return <HomePage onNavigate={setPage} />;
        }
    };

    return (
        <>
            <Header currentPage={page} onNavigate={setPage} />
            <main className="main-container">
                {renderPage()}
            </main>
        </>
    );
};

const Header = ({ currentPage, onNavigate }: { currentPage: string, onNavigate: (page: string) => void }) => {
    const navItems = ['home', 'live-report', 'voice-report', 'chat', 'study-buddy', 'journal', 'history', 'contacts', 'about'];
    const navLabels: { [key: string]: string } = {
        home: 'Home',
        'live-report': 'Live Video Report',
        'voice-report': 'Voice Report',
        chat: 'AI Support Chat',
        'study-buddy': 'Study Buddy',
        journal: 'Personal Journal',
        history: 'Report History',
        contacts: 'Emergency Contacts',
        about: 'About Us'
    };

    return (
        <header className="header">
            <nav className="navbar navbar-expand-lg navbar-light">
                <div className="container-fluid">
                    <a className="navbar-brand" href="#" onClick={() => onNavigate('home')}>🛡️ SafeSpace AI</a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            {navItems.map(item => (
                                <li className="nav-item" key={item}>
                                    <a
                                        className={`nav-link ${currentPage === item ? 'active' : ''}`}
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); onNavigate(item); }}
                                    >
                                        {navLabels[item]}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
};

const HomePage = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
    <div className="home-container">
        <div className="hero-section">
            <div className="hero-text">
                <h1 className="hero-title">Your Safety, Amplified.</h1>
                <p className="hero-subtitle">
                    Instantly report incidents, get live analysis, and find support using the power of your voice and our intelligent AI. We're here to listen and help, 24/7.
                </p>
            </div>
            <div className="hero-image">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: 'rgba(0, 122, 255, 0.8)'}} />
                      <stop offset="100%" style={{stopColor: 'rgba(78, 50, 253, 0.8)'}} />
                    </linearGradient>
                  </defs>
                  <path fill="url(#hero-gradient)" d="M54.1,-58.3C68.9,-46.7,78.8,-28.9,81.1,-10.1C83.4,8.7,78.1,28.4,66.1,43.4C54.1,58.4,35.4,68.7,16.5,73.5C-2.4,78.3,-21.5,77.6,-38.3,69.5C-55,61.4,-69.4,45.9,-76.3,27.9C-83.2,9.9,-82.6,-10.6,-74.6,-26.8C-66.6,-43,-51.2,-55,-35.1,-61.8C-19,-68.6,-2.2,-70.2,14.6,-68.3C31.4,-66.4,48.2,-69.9,54.1,-58.3Z" transform="translate(100 100)" />
                  <path fill="#FFFFFF" d="M126,63.2c-2.3-27-21.6-50.6-47.5-56.3c-2.8-0.6-5.7-0.6-8.5,0C44.1,12.6,24.8,36.2,22.5,63.2c-0.4,4.5,0.7,9,3.1,12.9 c6.9,11,20.2,17.9,34.4,17.9s27.5-6.8,34.4-17.9C125.3,72.2,126.3,67.7,126,63.2z M75,85.5c-7.6,0-13.8-6.2-13.8-13.8 c0-7.6,6.2-13.8,13.8-13.8s13.8,6.2,13.8,13.8C88.8,79.3,82.6,85.5,75,85.5z" transform="translate(25 45) scale(0.8)" />
                </svg>
            </div>
        </div>
        <div className="features-grid">
            <div className="feature-card" onClick={() => onNavigate('voice-report')} role="button" tabIndex={0} aria-label="Navigate to Voice Report page">
                <div className="feature-icon voice-icon">
                    <i className="bi bi-mic-fill"></i>
                </div>
                <h3 className="feature-title">Voice Report</h3>
                <p className="feature-description">Record a detailed incident report using just your voice. Our AI transcribes and analyzes it for you.</p>
            </div>
            <div className="feature-card" onClick={() => onNavigate('live-report')} role="button" tabIndex={0} aria-label="Navigate to Live Video Analysis page">
                <div className="feature-icon video-icon">
                    <i className="bi bi-camera-video-fill"></i>
                </div>
                <h3 className="feature-title">Live Video Analysis</h3>
                <p className="feature-description">Stream live video from your camera and get real-time AI analysis of the situation.</p>
            </div>
            <div className="feature-card" onClick={() => onNavigate('chat')} role="button" tabIndex={0} aria-label="Navigate to AI Support Chat page">
                <div className="feature-icon chat-icon">
                    <i className="bi bi-chat-dots-fill"></i>
                </div>
                <h3 className="feature-title">AI Support Chat</h3>
                <p className="feature-description">Connect with a supportive AI chatbot for guidance and a safe space to talk.</p>
            </div>
        </div>
    </div>
);

const AboutPage = () => (
    <div className="page-container about-page">
        <h2 className="text-center mb-5">Our Mission at SafeSpace AI</h2>
        
        <div className="about-section">
            <div className="about-icon"><i className="bi bi-bullseye"></i></div>
            <h3>Our Purpose</h3>
            <p>
                SafeSpace AI was born from a simple yet powerful idea: everyone deserves to feel safe and heard. We leverage cutting-edge artificial intelligence to provide immediate, accessible, and confidential support for individuals facing distressing situations. Our mission is to empower you with tools that can analyze situations, document incidents, and offer a supportive space, anytime and anywhere.
            </p>
        </div>
        
        <div className="about-section">
            <div className="about-icon"><i className="bi bi-cpu-fill"></i></div>
            <h3>How It Works</h3>
            <p>
                Our platform uses advanced AI models to understand and process your reports. Whether you're using your voice to describe an event or streaming live video, our technology works to identify key details, assess the situation's urgency, and provide a clear, summarized analysis. This is not just about data; it's about creating understanding from chaos, providing you with a coherent record when you need it most.
            </p>
        </div>

        <div className="about-section">
             <div className="about-icon"><i className="bi bi-shield-check"></i></div>
            <h3>Our Commitment to You</h3>
            <p>
                Your privacy and well-being are our top priorities. All reports and interactions are handled with the utmost confidentiality. We are committed to creating a non-judgmental, empathetic environment. SafeSpace AI is more than an app; it's a companion in your journey towards safety and peace of mind. We are continuously working to improve our technology to better serve you and our community.
            </p>
        </div>
    </div>
);

const EmergencyContactsPage = () => (
    <div className="page-container">
        <h2 className="text-center mb-4">Emergency Contacts (South Africa)</h2>
        <p className="text-center text-muted mb-5">
            This is a list of national emergency services. In a life-threatening situation, please contact them immediately.
        </p>

        <div className="contacts-grid">
            <div className="contact-card police">
                <div className="contact-card-header">
                    <i className="bi bi-shield-fill-exclamation"></i>
                    <h3>Police / Flying Squad</h3>
                </div>
                <a href="tel:10111" className="contact-number">10111</a>
                <p className="contact-description">For any crime-related emergencies and police assistance.</p>
            </div>
             <div className="contact-card medical">
                <div className="contact-card-header">
                    <i className="bi bi-heart-pulse-fill"></i>
                    <h3>Ambulance & Fire</h3>
                </div>
                <a href="tel:10177" className="contact-number">10177</a>
                <p className="contact-description">For medical emergencies and fire department assistance.</p>
            </div>
            <div className="contact-card general">
                <div className="contact-card-header">
                    <i className="bi bi-telephone-fill"></i>
                    <h3>Nationwide Emergency</h3>
                </div>
                <a href="tel:112" className="contact-number">112</a>
                <p className="contact-description">Can be dialed from any mobile phone in South Africa.</p>
            </div>
             <div className="contact-card support">
                <div className="contact-card-header">
                    <i className="bi bi-people-fill"></i>
                    <h3>GBV Command Centre</h3>
                </div>
                <a href="tel:0800150150" className="contact-number">0800 150 150</a>
                <p className="contact-description">24/7 support for victims of Gender-Based Violence.</p>
            </div>
             <div className="contact-card support">
                <div className="contact-card-header">
                    <i className="bi bi-chat-heart-fill"></i>
                    <h3>SADAG Mental Health</h3>
                </div>
                <a href="tel:0800567567" className="contact-number">0800 567 567</a>
                <p className="contact-description">For counseling and support regarding mental health issues.</p>
            </div>
            <div className="contact-card support">
                <div className="contact-card-header">
                    <i className="bi bi-person-standing-child"></i>
                    <h3>Childline South Africa</h3>
                </div>
                <a href="tel:116" className="contact-number">116</a>
                <p className="contact-description">A free, 24-hour service for children and teens in need of help.</p>
            </div>
        </div>
    </div>
);

interface AnalysisResult {
    category: string;
    tone: string;
    summary: string;
    movement_analysis: string;
}

const VoiceReportPage = ({ ai }: { ai: GoogleGenAI }) => {
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationDisplay, setLocationDisplay] = useState('Detecting...');
    const [isMapOpen, setIsMapOpen] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [language, setLanguage] = useState('en-US');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lng: longitude });
                    setLocationDisplay(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
                },
                () => {
                    setLocationDisplay("Unable to retrieve location.");
                }
            );
        } else {
            setLocationDisplay("Geolocation not supported.");
        }
    }, []);

    useEffect(() => {
        if (isMapOpen && mapContainerRef.current && !mapRef.current) {
            const center: [number, number] = location ? [location.lat, location.lng] : [-29.8, 24.0];
            const zoom = location ? 13 : 5;

            const southAfricaBounds: [[number, number], [number, number]] = [
                [-35.0, 16.0], // Southwest corner
                [-22.0, 33.0]  // Northeast corner
            ];

            const map = L.map(mapContainerRef.current, {
                maxBounds: southAfricaBounds,
                maxBoundsViscosity: 1.0, // Prevents dragging outside bounds
                minZoom: 5
            }).setView(center, zoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            const marker = L.marker(center, { draggable: true }).addTo(map);

            map.on('click', (e: any) => marker.setLatLng(e.latlng));

            mapRef.current = map;
            markerRef.current = marker;

            setTimeout(() => map.invalidateSize(), 100);
        }
    }, [isMapOpen, location]);

    const handleOpenMap = () => setIsMapOpen(true);

    const handleCloseMap = () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            markerRef.current = null;
        }
        setMapSearchQuery('');
        setIsMapOpen(false);
    };
    
    const handleConfirmLocation = () => {
        if (markerRef.current) {
            const { lat, lng } = markerRef.current.getLatLng();
            setLocation({ lat, lng });
            setLocationDisplay(`Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`);
        }
        handleCloseMap();
    };

    const handleMapSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mapSearchQuery.trim()) return;

        setIsSearchingLocation(true);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapSearchQuery)}&format=json&countrycodes=za&limit=1`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network response was not ok.");

            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newLatLng: [number, number] = [parseFloat(lat), parseFloat(lon)];
                mapRef.current?.setView(newLatLng, 15);
                markerRef.current?.setLatLng(newLatLng);
            } else {
                alert("Location not found. Please try a different search term or place the marker manually.");
            }
        } catch (error) {
            console.error("Error searching for location:", error);
            alert("An error occurred while searching for the location.");
        } finally {
            setIsSearchingLocation(false);
        }
    };
    
    const resetReport = () => {
        setTranscript('');
        setAnalysisResult(null);
        setIsSubmitting(false);
        setSubmissionError(null);
        setIsRecording(false);
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }
    };

    const handleAnalyze = async (finalTranscript: string) => {
        if (!finalTranscript) {
            alert("The transcript is empty. Please record a report first.");
            return;
        }
        setIsAnalyzing(true);
        setAnalysisResult(null);
        
        try {
            const prompt = `You are a safety report analysis AI. A user has provided a voice report about an incident. Analyze the following transcript to determine the tone, summarize the events, identify key movements or actions, and classify the incident into one of the following categories: 'Safety Hazard', 'Harassment', 'Vandalism', 'Medical Emergency', 'Suspicious Activity', 'Other'. Your response must be in a JSON format. Transcript: "${finalTranscript}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING, description: "The most relevant incident category from the provided list." },
                            tone: { type: Type.STRING, description: "The inferred emotional tone of the speaker (e.g., Urgent, Distressed, Panicked, Calm, Angry)." },
                            summary: { type: Type.STRING, description: "A concise, one-to-two sentence summary of what is happening." },
                            movement_analysis: { type: Type.STRING, description: "A brief description of the key movements or actions described in the report." }
                        },
                        required: ["category", "tone", "summary", "movement_analysis"]
                    }
                }
            });
            const result = JSON.parse(response.text) as AnalysisResult;
            setAnalysisResult(result);
        } catch (error) {
            console.error("Error analyzing report:", error);
            alert("There was an error analyzing your report. Please try again.");
            setAnalysisResult(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRecord = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            return;
        }

        if (!SpeechRecognition) {
            alert("Sorry, your browser doesn't support speech recognition.");
            return;
        }

        resetReport();
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        let finalTranscriptSinceLastResult = '';
        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscriptSinceLastResult += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setTranscript(finalTranscriptSinceLastResult + interimTranscript);
        };
        
        recognition.onstart = () => setIsRecording(true);
        
        recognition.onend = () => {
            setIsRecording(false);
            setTranscript(current => current.trim());
        };
        
        recognition.onerror = (event: any) => {
            if (event.error !== 'aborted') {
                console.error('Speech recognition error:', event.error);
                alert(`An error occurred during speech recognition: ${event.error}`);
            }
            setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const handleSubmit = async () => {
        if (!analysisResult) return;
        setIsSubmitting(true);
        setSubmissionError(null);
        try {
            const reportData = {
                type: 'Voice' as const,
                analysis: analysisResult,
                transcript: transcript,
                location: locationDisplay
            };
    
            const newReport = saveReportToStorage(reportData);
            
            // Simulate a small delay for user feedback
            await new Promise(resolve => setTimeout(resolve, 500));
    
            alert(`Report Submitted Successfully! Your reference ID is: ${newReport.id}`);
            resetReport();
        } catch (error: any) {
            console.error("Error submitting report:", error);
            setSubmissionError(`There was an error submitting your report locally: ${error.message}.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canEditText = !isRecording && !isAnalyzing && !analysisResult;

    return (
        <div className="page-container">
            <h2 className="text-center mb-4">AI-Powered Voice Report</h2>
            
            <div className="text-center mb-4">
                <button className={`mic-button ${isRecording ? 'recording' : ''}`} onClick={handleRecord} aria-label={isRecording ? 'Stop recording' : 'Start recording'} disabled={isAnalyzing || isSubmitting}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                      <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
                    </svg>
                </button>
                <p className="mt-2 text-muted">
                    {isRecording ? 'Recording... Tap to Stop' : (transcript && !analysisResult ? 'Recording complete. Review transcript and analyze.' : 'Tap to Record Incident')}
                </p>
            </div>
            
            <div className="mb-3">
                <label htmlFor="transcription" className="form-label">Full Transcript</label>
                <textarea 
                    className="form-control" 
                    id="transcription" 
                    rows={5} 
                    placeholder="Your transcribed report will appear here..."
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    readOnly={!canEditText}
                ></textarea>
                {canEditText && transcript && <div className="form-text">You can edit the transcript before analysis.</div>}
            </div>

            <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                    <label htmlFor="location" className="form-label">Location</label>
                    <div className="input-group">
                        <input type="text" className="form-control" id="location" value={locationDisplay} readOnly />
                        <button className="btn btn-outline-secondary" type="button" onClick={handleOpenMap} disabled={isAnalyzing || isSubmitting || isRecording}>Select on Map</button>
                    </div>
                </div>
                <div className="col-md-6">
                    <label htmlFor="language" className="form-label">Recording Language</label>
                    <select 
                        id="language" 
                        className="form-select" 
                        value={language} 
                        onChange={e => setLanguage(e.target.value)}
                        disabled={isRecording || isAnalyzing || isSubmitting}
                        aria-label="Select recording language"
                    >
                        <option value="en-US">English (US)</option>
                        <option value="en-ZA">English (South Africa)</option>
                        <option value="af-ZA">Afrikaans</option>
                        <option value="zu-ZA">isiZulu</option>
                        <option value="xh-ZA">isiXhosa</option>
                    </select>
                </div>
            </div>

            <div className="action-area mt-4">
                {isAnalyzing && (
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-2 text-muted">AI is analyzing your report...</p>
                    </div>
                )}
                
                {isSubmitting && (
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-2 text-muted">Submitting your confirmed report...</p>
                    </div>
                )}
                
                {analysisResult && !isSubmitting && (
                    <div className="card shadow-sm">
                        <div className="card-header bg-primary text-white"><h5 className="mb-0">Review AI Analysis</h5></div>
                        <div className="card-body">
                             <dl className="row mb-0">
                                <dt className="col-sm-4">Detected Category</dt>
                                <dd className="col-sm-8"><span className="badge bg-danger fs-6">{analysisResult.category}</span></dd>
                                <hr className="my-2"/>
                                <dt className="col-sm-4">Inferred Tone</dt>
                                <dd className="col-sm-8">{analysisResult.tone}</dd>
                                <hr className="my-2"/>
                                <dt className="col-sm-4">Key Action/Movement</dt>
                                <dd className="col-sm-8">{analysisResult.movement_analysis}</dd>
                                 <hr className="my-2"/>
                                <dt className="col-sm-4">Summary</dt>
                                <dd className="col-sm-8">{analysisResult.summary}</dd>
                            </dl>
                        </div>
                        <div className="card-footer bg-light p-3">
                            {submissionError && (
                                <div className="alert alert-danger" role="alert">
                                    {submissionError}
                                </div>
                            )}
                            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button onClick={resetReport} className="btn btn-secondary">Start Over</button>
                                <button onClick={handleSubmit} className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Confirm & Submit Report'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {!isRecording && transcript && !isAnalyzing && !analysisResult && !isSubmitting && (
                    <div className="d-grid">
                        <button className="btn btn-primary btn-lg" onClick={() => handleAnalyze(transcript)}>Analyze Report</button>
                    </div>
                )}
            </div>

            {isMapOpen && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1055 }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Select Incident Location</h5>
                                    <button type="button" className="btn-close" onClick={handleCloseMap} aria-label="Close"></button>
                                </div>
                                <div className="modal-body p-0">
                                    <form onSubmit={handleMapSearch} className="p-3 border-bottom d-flex gap-2">
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Search for a location in South Africa..." 
                                            value={mapSearchQuery}
                                            onChange={(e) => setMapSearchQuery(e.target.value)}
                                            disabled={isSearchingLocation}
                                        />
                                        <button className="btn btn-primary" type="submit" disabled={isSearchingLocation}>
                                            {isSearchingLocation ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Search'}
                                        </button>
                                    </form>
                                    <div ref={mapContainerRef} style={{ height: '55vh', width: '100%' }}></div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseMap}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={handleConfirmLocation}>Confirm Location</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


const LiveReportPage = ({ ai }: { ai: GoogleGenAI }) => {
    // State for live video
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLiveAnalyzing, setIsLiveAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('Camera is off. Start the camera to begin analysis.');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // State for incident reporting modal
    const [incidentDetails, setIncidentDetails] = useState<{ category: string; description: string; imageBase64: string; } | null>(null);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    const analyzeFrame = async () => {
        if (isLiveAnalyzing || !videoRef.current || !canvasRef.current || incidentDetails) return;

        setIsLiveAnalyzing(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            setIsLiveAnalyzing(false);
            return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];

        try {
            const prompt = `You are a security monitoring AI. Analyze the image from a live video feed. Your response must be in JSON format with "category" and "description". For "category", choose ONE of: "No Incident", "Safety Hazard", "Harassment", "Vandalism", "Medical Emergency", "Suspicious Activity", "Other". For "description", give a single sentence summary. If you detect Harassment, it is critical to categorize it as "Harassment".`;
            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
            const textPart = { text: prompt };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["category", "description"]
                    }
                }
            });

            const resultJson = JSON.parse(response.text);
            const { category, description } = resultJson;

            setAnalysisResult(`${category}: ${description}`);

            if (category !== 'No Incident') {
                setIncidentDetails({ category, description, imageBase64: base64Data });
                if (analysisIntervalRef.current) {
                    clearInterval(analysisIntervalRef.current);
                    analysisIntervalRef.current = null;
                }
            }
        } catch (error) {
            console.error('Error analyzing frame:', error);
            setAnalysisResult('Error during analysis. Please check console.');
        } finally {
            setIsLiveAnalyzing(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (analysisIntervalRef.current) {
            clearInterval(analysisIntervalRef.current);
            analysisIntervalRef.current = null;
        }
        setIsCameraOn(false);
        setIsLiveAnalyzing(false);
        setAnalysisResult('Camera is off. Start the camera to begin analysis.');
        setIncidentDetails(null);
        setSubmissionError(null);
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraOn(true);
            setAnalysisResult('Camera started. Point towards the area of interest.');
            setIncidentDetails(null);
            setSubmissionError(null);
            analysisIntervalRef.current = setInterval(analyzeFrame, 4000); // Analyze every 4 seconds
        } catch (err) {
            console.error("Error accessing camera: ", err);
            alert("Could not access the camera. Please ensure permissions are granted.");
            stopCamera();
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    const handleConfirmReport = async () => {
        if (!incidentDetails) return;
        setIsSubmittingReport(true);
        setSubmissionError(null);
        try {
            const reportData = {
                type: 'Live Video' as const,
                analysis: {
                    category: incidentDetails.category,
                    summary: incidentDetails.description,
                },
                imageBase64: incidentDetails.imageBase64,
            };
            
            const newReport = saveReportToStorage(reportData);
            
            // Simulate a small delay for user feedback
            await new Promise(resolve => setTimeout(resolve, 500));

            alert(`Report Submitted Successfully! Your reference ID is: ${newReport.id}`);
            stopCamera();
        } catch (error: any) {
            console.error("Error submitting confirmed report:", error);
            setSubmissionError(`There was an error submitting your report locally: ${error.message}.`);
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const handleCancelReport = () => {
        setIncidentDetails(null);
        setSubmissionError(null);
        if (isCameraOn && !analysisIntervalRef.current) {
            setAnalysisResult('Monitoring resumed.');
            analysisIntervalRef.current = setInterval(analyzeFrame, 4000);
        }
    };

    return (
        <div className="page-container">
            <h2 className="text-center mb-4">Live Automated Report</h2>

            <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                    Live Video Feed
                    <span className={`badge ${isCameraOn ? 'bg-success' : 'bg-danger'}`}>{isCameraOn ? 'ON' : 'OFF'}</span>
                </div>
                <div className="card-body">
                    <div className="video-container mb-3">
                        <video ref={videoRef} className="live-video" autoPlay playsInline muted style={{ display: isCameraOn ? 'block' : 'none' }}></video>
                        {!isCameraOn && <div className="video-placeholder d-flex flex-column align-items-center justify-content-center">
                            <i className="bi bi-camera-video-off" style={{fontSize: '4rem'}}></i>
                            <p className="mt-2">Camera is Off</p>
                        </div>}
                    </div>
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                    {!isCameraOn ?
                        <button className="btn btn-primary w-100" onClick={startCamera}>
                            <i className="bi bi-camera-video-fill me-2"></i>Start Camera & Analysis
                        </button>
                        :
                        <button className="btn btn-danger w-100" onClick={stopCamera}>
                            <i className="bi bi-stop-circle-fill me-2"></i>Stop Camera
                        </button>
                    }
                    {isCameraOn && (
                        <div className={`analysis-box mt-3 ${isLiveAnalyzing ? 'analyzing' : ''}`}>
                            <strong>AI Status:</strong> {isLiveAnalyzing ? 'Analyzing frame...' : analysisResult}
                        </div>
                    )}
                </div>
            </div>
            
             {incidentDetails && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
                    <div className="modal fade show d-block" id="incidentModal" tabIndex={-1} aria-labelledby="incidentModalLabel" aria-modal="true" role="dialog" style={{ zIndex: 1055 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="incidentModalLabel">
                                        <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i> Incident Detected: {incidentDetails.category}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={handleCancelReport} disabled={isSubmittingReport} aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <p><strong>AI Analysis:</strong> {incidentDetails.description}</p>
                                    <img src={`data:image/jpeg;base64,${incidentDetails.imageBase64}`} alt="Incident snapshot" className="img-fluid rounded mb-3" />
                                    {submissionError && (
                                        <div className="alert alert-danger" role="alert">
                                            {submissionError}
                                        </div>
                                    )}
                                    <p className="text-muted small">An incident has been automatically detected. Please review and confirm to submit a report, or cancel to resume monitoring.</p>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={handleCancelReport} disabled={isSubmittingReport}>Cancel</button>
                                    <button type="button" className="btn btn-danger" onClick={handleConfirmReport} disabled={isSubmittingReport}>
                                        {isSubmittingReport ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                <span className="ms-2">Submitting...</span>
                                            </>
                                        ) : 'Confirm & Submit Report'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


const AIChatPage = ({ ai }: { ai: GoogleGenAI }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatWindowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ai) return;
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a friendly and supportive AI assistant for SafeSpace AI. Your role is to listen, provide comfort, and offer helpful, non-judgmental guidance. Keep responses concise and empathetic."
            }
        });
        setChat(newChat);
        setMessages([{ role: 'ai', text: "How can I help you today?" }]);
    }, [ai]);

    useEffect(() => {
        if(chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;
        
        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const responseStream = await chat.sendMessageStream({ message: currentInput });
            let aiResponseText = '';
            setMessages(prev => [...prev, { role: 'ai', text: '' }]); 

            for await (const chunk of responseStream) {
                aiResponseText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = aiResponseText;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h2 className="text-center mb-4">AI Support Chat</h2>
            <div className="chat-window" ref={chatWindowRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}-message`}>
                        <div className="chat-bubble">{msg.text}</div>
                    </div>
                ))}
                {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
                     <div className="chat-message ai-message">
                        <div className="chat-bubble">
                            <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <form onSubmit={handleSend} className="d-flex gap-2">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={isLoading}
                    aria-label="Your message"
                />
                <button type="submit" className="btn btn-primary" disabled={isLoading || !input.trim()}>
                    {isLoading ? <div className="spinner-border spinner-border-sm" role="status"></div> : 'Send'}
                </button>
            </form>
        </div>
    );
};

const StudyBuddyPage = ({ ai }: { ai: GoogleGenAI }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [currentQuery, setCurrentQuery] = useState('');
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState('');

    const topics = [
        "What is workplace harassment?",
        "Understanding cyberbullying",
        "Key aspects of the Protection from Harassment Act in South Africa",
        "How to document incidents of harassment",
        "Ways to support a friend experiencing harassment",
        "Creating a safer online environment"
    ];

    const fetchAnswer = async (question: string) => {
        if (!question) return;

        setIsLoading(true);
        setAnswer('');
        setError('');
        setCurrentQuery(question);
        setUserInput(question);

        try {
            const systemInstruction = `You are an educational 'Study Buddy' focused on harassment awareness and safety, with a special focus on the context of South Africa. Your goal is to provide clear, informative, and supportive answers.
- Structure your answers with clear headings (using markdown ##) and bullet points (using markdown *) for readability.
- When relevant, mention specific South African laws (like the Protection from Harassment Act 17 of 2011) or resources, but you must state that this is not legal advice. Frame it as "general information".
- Always maintain a supportive and non-judgmental tone.
- If a question is outside the scope of harassment and safety education, politely state that you can only answer questions on those topics.
- Conclude responses that involve reporting or seeking help with a clear disclaimer, for example: "For immediate danger, please contact emergency services (10111). For support, consider reaching out to organizations like the SADAG or the GBV Command Centre."`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: question,
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            setAnswer(response.text);

        } catch (err) {
            console.error("Error fetching answer:", err);
            setError("Sorry, I couldn't fetch an answer right now. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAnswer(userInput);
    };
    
    const formatAnswer = (text: string) => {
        const formattedElements: React.ReactNode[] = [];
        let listItems: React.ReactNode[] = [];

        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('* ')) {
                listItems.push(<li key={`li-${i}`}>{line.substring(2)}</li>);
            } else {
                if (listItems.length > 0) {
                    formattedElements.push(<ul key={`ul-${i - 1}`} className="mb-3">{listItems}</ul>);
                    listItems = [];
                }
                if (line.startsWith('## ')) {
                    formattedElements.push(<h5 key={`h5-${i}`} className="mt-4 mb-2 fw-bold">{line.substring(3)}</h5>);
                } else if (line.trim() !== '') {
                    formattedElements.push(<p key={`p-${i}`} className="mb-2">{line}</p>);
                }
            }
        }
        if (listItems.length > 0) {
            formattedElements.push(<ul key="ul-last" className="mb-3">{listItems}</ul>);
        }

        return formattedElements;
    };

    return (
        <div className="page-container study-buddy-page">
            <div className="text-center">
                <div className="study-buddy-icon"><i className="bi bi-book-half"></i></div>
                <h2 className="mb-2">Harassment Awareness Study Buddy</h2>
                <p className="lead text-muted mb-4">
                    Your safe space to learn about harassment, understand your rights, and find resources.
                </p>
            </div>
            
            <div className="mb-4">
                <h4 className="topic-suggestion-header">Start with a topic:</h4>
                <div className="topic-buttons-container">
                    {topics.map(topic => (
                        <button key={topic} className="btn topic-btn" onClick={() => fetchAnswer(topic)} disabled={isLoading}>
                            {topic}
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={handleFormSubmit} className="mb-4">
                <div className="input-group input-group-lg">
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Or ask your own question..."
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        disabled={isLoading}
                        aria-label="Ask a question about harassment"
                    />
                    <button className="btn btn-primary" type="submit" disabled={isLoading || !userInput.trim()}>
                        {isLoading && currentQuery === userInput ? <div className="spinner-border spinner-border-sm" role="status"></div> : 'Ask'}
                    </button>
                </div>
            </form>

            <div className="answer-section">
                {isLoading && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status"></div>
                        <p className="mt-3 text-muted">Your Study Buddy is thinking...</p>
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}
                {answer && !isLoading && (
                    <div className="answer-container card">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">Showing results for: "{currentQuery}"</h5>
                        </div>
                        <div className="card-body">
                           {formatAnswer(answer)}
                        </div>
                    </div>
                )}
                {!isLoading && !answer && !error && (
                    <div className="text-center text-muted p-5 bg-light rounded-3">
                        <p className="mb-0">The answer to your question will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


interface MoodHistoryEntry {
    mood: number;
    entry: string;
    date: string;
}

const JournalPage = () => {
    const [mood, setMood] = useState(3); // 1-5 scale
    const [entry, setEntry] = useState('');
    const [moodHistory, setMoodHistory] = useState<MoodHistoryEntry[]>(() => {
        try {
            const saved = localStorage.getItem('moodHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Could not parse mood history from localStorage", error);
            return [];
        }
    });
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    const moods = [{ emoji: '😞', value: 1 }, { emoji: '😟', value: 2 }, { emoji: '😐', value: 3 }, { emoji: '🙂', value: 4 }, { emoji: '😄', value: 5 }];

    useEffect(() => {
        localStorage.setItem('moodHistory', JSON.stringify(moodHistory));
        if (chartRef.current && moodHistory.length > 0) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if(!ctx) return;

            let negativeCount = 0;
            let neutralCount = 0;
            let positiveCount = 0;

            moodHistory.forEach(h => {
                if (h.mood <= 2) {
                    negativeCount++;
                } else if (h.mood === 3) {
                    neutralCount++;
                } else {
                    positiveCount++;
                }
            });
            
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Negative', 'Neutral', 'Positive'],
                    datasets: [{
                        label: 'Mood Count',
                        data: [negativeCount, neutralCount, positiveCount],
                        backgroundColor: [
                            'rgba(230, 119, 119, 0.7)',
                            'rgba(170, 170, 170, 0.7)',
                            'rgba(119, 199, 119, 0.7)'
                        ],
                        borderColor: [
                            'rgba(230, 119, 119, 1)',
                            'rgba(170, 170, 170, 1)',
                            'rgba(119, 199, 119, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: { 
                        y: { 
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                precision: 0
                            }
                        } 
                    },
                    plugins: { 
                        legend: { 
                            display: false 
                        } 
                    }
                }
            });
        } else if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }
    }, [moodHistory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!entry.trim()) {
            alert("Please write a journal entry.");
            return;
        }
        const newHistory = [...moodHistory, { mood, entry, date: new Date().toISOString() }].slice(-7); // Keep last 7 entries
        setMoodHistory(newHistory);
        setEntry('');
        setMood(3);
        alert("Journal entry saved!");
    };
    
    return (
        <div className="page-container">
            <h2 className="text-center mb-4">Personal Reflection Journal</h2>
            <form onSubmit={handleSubmit}>
                <div className="mood-selector">
                    {moods.map(m => (
                        <span key={m.value} className={`mood-emoji ${mood === m.value ? 'selected' : ''}`} onClick={() => setMood(m.value)} role="button" aria-label={`Mood: ${m.value}`}>{m.emoji}</span>
                    ))}
                </div>
                 <div className="mb-3">
                    <textarea className="form-control" rows={6} value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Write your reflection for today..."></textarea>
                </div>
                <div className="d-grid mb-4">
                    <button type="submit" className="btn btn-primary">Submit Entry</button>
                </div>
            </form>
            <hr />
            <h3 className="text-center mt-4 mb-3">Mood Trend This Week</h3>
            <div>
                {moodHistory.length > 0 ? <canvas ref={chartRef}></canvas> : <p className="text-center text-muted">No mood history yet. Submit an entry to see your trend!</p>}
            </div>
        </div>
    );
};


const HistoryPage = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    const fetchReports = () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = getReportsFromStorage();
            setReports(data);
        } catch (err: any) {
            setError("Failed to load reports from local storage.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to delete all report history? This action cannot be undone.')) {
            setError(null);
            try {
                clearReportsFromStorage();
                setReports([]);
                alert('Report history cleared successfully.');
            } catch (err: any) {
                setError("Failed to clear history from local storage.");
                console.error(err);
            }
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Loading report history...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="alert alert-danger mt-4" role="alert">
                    <h4 className="alert-heading"><i className="bi bi-exclamation-triangle-fill"></i> Error</h4>
                    <p>
                        There was an error loading or modifying the report history from your browser's local storage.
                    </p>
                    <hr />
                    <p className="mb-0 small text-muted">
                        <strong>Details:</strong> {error}
                    </p>
                </div>
            );
        }
        if (reports.length === 0) {
            return <p className="text-center text-muted py-5">No reports have been submitted yet.</p>;
        }
        return (
            <ul className="history-list">
                {reports.map(report => (
                    <li key={report.id} className="history-item" onClick={() => setSelectedReport(report)} role="button" tabIndex={0}>
                        <div className={`history-item-icon ${report.type === 'Voice' ? 'voice' : 'video'}`}>
                           <i className={`bi ${report.type === 'Voice' ? 'bi-mic-fill' : 'bi-camera-video-fill'}`}></i>
                        </div>
                        <div className="history-item-info">
                            <h5>{report.analysis.category}</h5>
                            <p>{report.analysis.summary}</p>
                        </div>
                        <div className="history-item-time">
                           {new Date(report.timestamp).toLocaleString()}
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="page-container">
            <div className="history-header">
                <h2 className="mb-0">Report History</h2>
                <button 
                    className="btn btn-sm btn-outline-danger" 
                    onClick={handleClearHistory}
                    disabled={reports.length === 0 || isLoading}
                >
                    Clear History
                </button>
            </div>
            
            {renderContent()}

            {selectedReport && (
                 <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1055 }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Report Details (ID: {selectedReport.id})</h5>
                                    <button type="button" className="btn-close" onClick={() => setSelectedReport(null)} aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <dl className="row">
                                        <dt className="col-sm-3">Report Type</dt>
                                        <dd className="col-sm-9">{selectedReport.type}</dd>
                                        
                                        <dt className="col-sm-3">Timestamp</dt>
                                        <dd className="col-sm-9">{new Date(selectedReport.timestamp).toLocaleString()}</dd>

                                        <dt className="col-sm-3">Category</dt>
                                        <dd className="col-sm-9"><span className="badge bg-danger">{selectedReport.analysis.category}</span></dd>

                                        <dt className="col-sm-3">AI Summary</dt>
                                        <dd className="col-sm-9">{selectedReport.analysis.summary}</dd>

                                        {selectedReport.analysis.tone && <>
                                            <dt className="col-sm-3">Inferred Tone</dt>
                                            <dd className="col-sm-9">{selectedReport.analysis.tone}</dd>
                                        </>}

                                        {selectedReport.analysis.movement_analysis && <>
                                            <dt className="col-sm-3">Movement/Action</dt>
                                            <dd className="col-sm-9">{selectedReport.analysis.movement_analysis}</dd>
                                        </>}

                                        {selectedReport.location && <>
                                            <dt className="col-sm-3">Location</dt>
                                            <dd className="col-sm-9">{selectedReport.location}</dd>
                                        </>}

                                        {selectedReport.transcript && <>
                                            <dt className="col-sm-3">Full Transcript</dt>
                                            <dd className="col-sm-9"><p className="mb-0" style={{whiteSpace: 'pre-wrap'}}>{selectedReport.transcript}</p></dd>
                                        </>}
                                        
                                        {selectedReport.imageBase64 && <>
                                            <dt className="col-sm-3">Snapshot</dt>
                                            <dd className="col-sm-9">
                                                <img src={`data:image/jpeg;base64,${selectedReport.imageBase64}`} alt="Incident snapshot" className="report-detail-img" />
                                            </dd>
                                        </>}
                                    </dl>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedReport(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
