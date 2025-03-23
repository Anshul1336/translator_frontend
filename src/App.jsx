"use client"

import { useState } from "react";
import { ArrowRight, Mic } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";

// Language mapping (Full Name <-> Code)
const languageMap = {
  english: "en",
  hindi: "hi",
  bengali: "bn",
  tamil: "ta",
  telugu: "te",
  gujarati: "gu",
  spanish: "es",
  french: "fr",
  german: "de",
  chinese: "zh",
  japanese: "ja",
  russian: "ru",
};

export default function AudioTranslator() {
  const [sourceLanguage, setSourceLanguage] = useState("english");
  const [targetLanguage, setTargetLanguage] = useState("hindi");
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSourceLanguageChange = (value) => {
    setSourceLanguage(value);
  };

  const handleTargetLanguageChange = (value) => {
    setTargetLanguage(value);
  };

  const handleMicClick = async () => {
    try {
      if (!isRecording) {
        console.log("🎤 Starting recording...");
        setErrorMessage("");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        let audioChunks = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = async () => {
          console.log("🛑 Recording stopped");
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", audioBlob);
          formData.append("source_language", languageMap[sourceLanguage]);
          formData.append("target_language", languageMap[targetLanguage]);

          console.log("📡 Sending audio to backend...");
          try {
            const response = await fetch("https://translatorbackend-production.up.railway.app/translate", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              if (response.status === 400) {
                setErrorMessage("⚠️ Speak Again...");
              } else {
                setErrorMessage("⚠️ Server Error, Try Again...");
              }
              return;
            }

            const data = await response.json();
            console.log("✅ Response from backend:", data);

            if (data.error) {
              setErrorMessage("⚠️ Speak Again...");
              return;
            }

            setOriginalText(data.original_text);
            setTranslatedText(data.translated_text);
            setErrorMessage("");

            if (data.audio_url) {
              console.log("🔊 Playing translated audio:", data.audio_url);
              const audio = new Audio(data.audio_url + "?t=" + new Date().getTime());
              audio.play();
            }
          } catch (error) {
            console.error("❌ Error processing audio:", error);
            setErrorMessage("⚠️ Speak Again...");
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } else {
        console.log("⏹ Stopping recording...");
        mediaRecorder.stop();
        setIsRecording(false);
      }
    } catch (error) {
      console.error("❌ Error recording:", error);
      setErrorMessage("⚠️ Speak Again...");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 p-4">
      <Card className="w-full max-w-2xl p-8 space-y-8 relative overflow-visible">
        <div className="flex items-center gap-3 mb-6">
          <Mic className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Audio Translator</h1>
        </div>

        <div className="flex items-center gap-4 justify-center relative">
          <div className="relative">
            <Select value={sourceLanguage} onValueChange={(value) => {
              handleSourceLanguageChange(value);
              if (value === targetLanguage) {
                setTargetLanguage(Object.keys(languageMap).find(lang => lang !== value));
              }
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue>{sourceLanguage.charAt(0).toUpperCase() + sourceLanguage.slice(1)}</SelectValue>
              </SelectTrigger>
              <SelectContent className="absolute top-full left-0 w-full bg-white shadow-lg z-50">
                {Object.keys(languageMap)
                  // .filter((lang) => lang !== targetLanguage)
                  .map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <ArrowRight className="w-5 h-5 text-blue-500" />

          <div className="relative">
            <Select value={targetLanguage} onValueChange={handleTargetLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue>{targetLanguage ? targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1) : "Select Language"}</SelectValue>
              </SelectTrigger>
              <SelectContent className="absolute top-full left-0 w-full bg-white shadow-lg z-50">
                {Object.keys(languageMap)
                  .filter((lang) => lang !== sourceLanguage)
                  .map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center my-8 flex-col items-center">
          <Button
            type="button"
            size="lg"
            className={`w-20 h-20 rounded-full hover:scale-105 transition-transform ${isRecording ? "bg-gray-600" : "bg-black"
              }`}
            onClick={handleMicClick}
          >
            <Mic className="w-8 h-8" />
          </Button>
          {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Original Text:</h2>
            <Textarea
              value={originalText}
              readOnly
              placeholder="Your speech will appear here..."
              className="min-h-[100px] resize-none bg-muted/50"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Translated Text:</h2>
            <Textarea
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
              className="min-h-[100px] resize-none bg-muted/50"
            />
          </div>
        </div>

      </Card>
    </div>
  );

}
