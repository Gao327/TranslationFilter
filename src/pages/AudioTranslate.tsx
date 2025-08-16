import React, { useState, useRef } from 'react';
import { ArrowLeft, Mic, Square, Play, Pause, Volume2, Copy, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { baiduTranslationService } from '../services/baiduTranslationService';
import { useTranslationStore } from '../store/translationStore';
import { toast } from 'sonner';

export default function AudioTranslate() {
  const navigate = useNavigate();
  const { addTranslation, addRecentLanguagePair } = useTranslationStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translatedAudio, setTranslatedAudio] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        processAudio(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // 将音频转换为base64格式
      const arrayBuffer = await blob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // 调用百度语音翻译API
      const result = await baiduTranslationService.translateSpeech({
        voice: base64Audio,
        format: 'wav',
        rate: 16000,
        channel: 1,
        sourceLang,
        targetLang
      });
      
      setTranscript(result.originalText);
      setTranslatedText(result.translatedText);
      setTranslatedAudio(result.translatedAudio);
      
      // 添加到翻译历史
      addTranslation({
        sourceText: result.originalText,
        translatedText: result.translatedText,
        sourceLang,
        targetLang,
        type: 'audio',
        confidence: 0.9,
        model: 'baidu',
        isFavorite: false
      });
      
      // 更新最近使用的语言对
      addRecentLanguagePair({ source: sourceLang, target: targetLang });
      
      toast.success('语音翻译完成！');
    } catch (error) {
      console.error('语音翻译错误:', error);
      setError(error instanceof Error ? error.message : '语音翻译失败');
      toast.error('语音翻译失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayback = () => {
    if (audioBlob) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  const playTranslatedAudio = () => {
    if (translatedAudio) {
      const audio = new Audio(`data:audio/wav;base64,${translatedAudio}`);
      audio.play().catch(error => {
        console.error('播放翻译音频失败:', error);
        toast.error('播放失败');
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setTranscript('');
    setTranslatedText('');
    setTranslatedAudio(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleShare = async (text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '翻译结果',
          text: text
        });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('已复制到剪贴板');
      }
    } catch (error) {
      toast.error('分享失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
            语音翻译
          </h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Language Settings */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">翻译设置</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">源语言</label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">自动检测</option>
                <option value="zh">中文</option>
                <option value="en">英语</option>
                <option value="ja">日语</option>
                <option value="ko">韩语</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">目标语言</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">英语</option>
                <option value="zh">中文</option>
                <option value="ja">日语</option>
                <option value="ko">韩语</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-sm text-red-700">
              <strong>错误:</strong> {error}
            </div>
          </div>
        )}
        {/* Recording Interface */}
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          {/* Waveform Visualization */}
          <div className="h-20 flex items-center justify-center mb-6">
            {isRecording ? (
              <div className="flex items-center space-x-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-600 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 40 + 10}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-gray-400">
                <Volume2 className="w-12 h-12 mx-auto" />
                <p className="text-sm mt-2">点击录音按钮开始</p>
              </div>
            )}
          </div>

          {/* Recording Time */}
          <div className="text-2xl font-mono text-gray-900 mb-6">
            {formatTime(recordingTime)}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-6">
            {audioBlob && (
              <button
                onClick={togglePlayback}
                className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-gray-600" />
                ) : (
                  <Play className="w-6 h-6 text-gray-600" />
                )}
              </button>
            )}
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-6 rounded-full transition-all ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            
            {audioBlob && (
              <button
                onClick={resetRecording}
                className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <span className="text-gray-600 text-sm font-medium">重录</span>
              </button>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-600">正在识别语音内容...</p>
          </div>
        )}

        {/* Transcript */}
        {transcript && !isProcessing && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <div className="text-sm text-gray-500 mb-2">识别文字</div>
              <div className="text-gray-900 leading-relaxed">
                {transcript}
              </div>
            </div>
            <div className="p-4 flex space-x-2">
              <button
                onClick={() => handleCopy(transcript)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>复制</span>
              </button>
              <button
                onClick={() => handleShare(transcript)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>分享</span>
              </button>
            </div>
          </div>
        )}

        {/* Translation */}
        {translatedText && !isProcessing && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <div className="text-sm text-gray-500 mb-2">翻译结果</div>
              <div className="text-gray-900 leading-relaxed">
                {translatedText}
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {translatedAudio && (
                <button
                  onClick={playTranslatedAudio}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>播放翻译语音</span>
                </button>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCopy(translatedText)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>复制</span>
                </button>
                <button
                  onClick={() => handleShare(translatedText)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>分享</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden audio element for playback */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}