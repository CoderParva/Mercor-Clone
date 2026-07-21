import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import AIAvatar from '../components/AIAvatar';

const SpeechRecognitionAPI =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const speechSupported = !!SpeechRecognitionAPI && typeof window !== 'undefined' && 'speechSynthesis' in window;

export default function AIInterview() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [job, setJob] = useState(null);
  const [stage, setStage] = useState('setup'); // setup | asking | listening | submitting | result
  const [permissionError, setPermissionError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  const [interview, setInterview] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [starting, setStarting] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    api.get(`/jobs/${jobId}`).then((res) => setJob(res.data.job));
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, [jobId]);

  const enableDevices = async () => {
    setPermissionError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
    } catch (err) {
      setPermissionError('Camera/microphone access is required to take this interview. Please allow access and try again — check your browser\'s site settings if the prompt didn\'t appear.');
    }
  };

  const speak = (text) =>
    new Promise((resolve) => {
      if (!speechSupported) return resolve();
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.onend = resolve;
      utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    });

  const startListening = useCallback(() => {
    if (!speechSupported) return;
    finalTranscriptRef.current = '';
    setLiveTranscript('');
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      setLiveTranscript(finalTranscriptRef.current + interim);
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setLiveTranscript((prev) => prev || `[Voice input error: ${event.error}. Try typing instead, or check mic permissions.]`);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setStage('listening');
  }, []);

  const askQuestion = useCallback(
    async (index, currentInterview) => {
      setStage('asking');
      setLiveTranscript('');
      setManualAnswer('');
      const questionText = currentInterview.questions[index].question;
      await speak(questionText);
      startListening();
    },
    [startListening]
  );

  const startInterview = async () => {
    setStarting(true);
    try {
      const res = await api.post('/interviews/start', { jobId });
      setInterview(res.data.interview);
      setAnswers(new Array(res.data.interview.questions.length).fill(''));
      setQuestionIndex(0);
      askQuestion(0, res.data.interview);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start interview', 'error');
    } finally {
      setStarting(false);
    }
  };

  const finishAnswering = () => {
    recognitionRef.current?.stop();
    const spokenAnswer = (finalTranscriptRef.current || liveTranscript).trim();
    const finalAnswer = speechSupported ? spokenAnswer : manualAnswer.trim();

    if (!finalAnswer) {
      showToast('Please provide an answer before continuing', 'error');
      return;
    }

    const nextAnswers = [...answers];
    nextAnswers[questionIndex] = finalAnswer;
    setAnswers(nextAnswers);

    const nextIndex = questionIndex + 1;
    if (nextIndex < interview.questions.length) {
      setQuestionIndex(nextIndex);
      askQuestion(nextIndex, interview);
    } else {
      submitInterview(nextAnswers);
    }
  };

  const submitInterview = async (finalAnswers) => {
    setStage('submitting');
    try {
      const res = await api.put(`/interviews/${interview._id}/submit`, { answers: finalAnswers });
      setResult(res.data.interview);
      setStage('result');
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit interview', 'error');
      setStage('listening');
    }
  };

  if (!job) return <p className="center-msg">Loading...</p>;

  const showBigPreview = stage === 'setup';

  return (
    <div className="page ai-interview-page">
      <h1>AI Interview — {job.title}</h1>

      {(stage === 'setup' || stage === 'asking' || stage === 'listening') && (
        <div className={showBigPreview ? 'interview-setup-grid' : 'interview-live-grid'}>
          <div className={showBigPreview ? 'camera-preview' : 'camera-preview small'}>
            <video ref={videoRef} autoPlay muted playsInline />
            {stage === 'setup' && !cameraReady && (
              <div className="camera-overlay">
                <p><strong>Camera & mic access required</strong></p>
                <p>You must enable camera and microphone access before starting this interview.</p>
              </div>
            )}
          </div>

          {stage === 'setup' && (
            <div className="interview-setup-side">
              <p>
                This is a spoken AI interview: you'll hear each question read aloud, then answer by
                speaking — your response is transcribed live and scored automatically at the end.
                Camera and microphone access is required to begin.
              </p>
              {!speechSupported && (
                <p className="status-msg error">
                  Your browser doesn't support voice transcription. Use Chrome or Edge for the spoken
                  experience — you'll still need to grant camera/mic access to proceed, and can type
                  your answers instead of speaking them.
                </p>
              )}
              {permissionError && <p className="status-msg error">{permissionError}</p>}
              <div className="interview-setup-actions">
                {!cameraReady ? (
                  <button className="btn primary" onClick={enableDevices}>Enable camera & mic to continue</button>
                ) : (
                  <button className="btn primary" onClick={startInterview} disabled={starting}>
                    {starting ? 'Generating questions...' : 'Start Interview'}
                  </button>
                )}
              </div>
              {!cameraReady && (
                <p className="resume-hint">
                  Camera and microphone access is required — the Start button will appear once granted.
                </p>
              )}
            </div>
          )}

          {(stage === 'asking' || stage === 'listening') && interview && (
            <div className="interview-live-main">
              <div className="interview-progress-bar">
                <div
                  className="interview-progress-fill"
                  style={{ width: `${((questionIndex + (stage === 'listening' ? 0.5 : 0)) / interview.questions.length) * 100}%` }}
                />
              </div>
              <span className="section-label">
                Question {questionIndex + 1} of {interview.questions.length}
              </span>
              <AIAvatar mode={stage === 'asking' ? 'speaking' : 'listening'} />
              <p className="interview-question-text">{interview.questions[questionIndex].question}</p>

              {speechSupported ? (
                <div className="live-transcript-box">
                  <p className="resume-hint">Your answer (live transcript):</p>
                  <p>{liveTranscript || <em>Start speaking...</em>}</p>
                </div>
              ) : (
                <textarea
                  rows={4}
                  className="manual-answer-box"
                  placeholder="Type your answer..."
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                />
              )}

              <button className="btn primary" onClick={finishAnswering} disabled={stage === 'asking'}>
                {questionIndex + 1 < interview.questions.length ? 'Finish Answer & Continue' : 'Finish Answer & Submit'}
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 'submitting' && (
        <p className="center-msg">Scoring your interview...</p>
      )}

      {stage === 'result' && result && (
        <div className="interview-result">
          <div className="interview-score">
            <span className="score-number">{result.score}</span>
            <span className="score-out-of">/ 10</span>
          </div>
          <p className="interview-feedback">{result.feedback}</p>

          {result.questions?.some((q) => typeof q.score === 'number') && (
            <div className="interview-breakdown">
              <p className="section-label" style={{ textAlign: 'left' }}>Per-question breakdown</p>
              {result.questions.map((q, i) => (
                <div className="breakdown-row" key={i}>
                  <div className="breakdown-row-top">
                    <strong>Q{i + 1}. {q.question}</strong>
                    <span className="interview-score-badge">{q.score}/10</span>
                  </div>
                  <p>{q.feedback}</p>
                </div>
              ))}
            </div>
          )}

          <button className="btn secondary" onClick={() => navigate(`/jobs/${jobId}`)}>
            Back to job
          </button>
        </div>
      )}
    </div>
  );
}