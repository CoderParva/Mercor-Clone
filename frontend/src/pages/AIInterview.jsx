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

  const [interviewId, setInterviewId] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [mainIndex, setMainIndex] = useState(0); // which main question (0-based) we're on
  const [phase, setPhase] = useState('main'); // 'main' | 'followup' — which prompt we're currently answering
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [roundsCompleted, setRoundsCompleted] = useState(0); // for progress bar (main+followup each count as 1)

  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [starting, setStarting] = useState(false);

  const [devices, setDevices] = useState({ mics: [], speakers: [], cams: [] });
  const [selectedDevices, setSelectedDevices] = useState({ mic: '', speaker: '', cam: '' });
  const [micLevel, setMicLevel] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    api.get(`/jobs/${jobId}`).then((res) => setJob(res.data.job));
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close?.();
    };
  }, [jobId]);

  const startMicMeter = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.min(100, Math.round((avg / 140) * 100)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* meter is a nice-to-have; ignore failures */ }
  };

  const enableDevices = async (overrides = {}) => {
    setPermissionError('');
    try {
      const constraints = {
        video: overrides.cam ? { deviceId: { exact: overrides.cam } } : true,
        audio: overrides.mic ? { deviceId: { exact: overrides.mic } } : true,
      };
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);

      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        mics: list.filter((d) => d.kind === 'audioinput'),
        speakers: list.filter((d) => d.kind === 'audiooutput'),
        cams: list.filter((d) => d.kind === 'videoinput'),
      });
      setSelectedDevices((prev) => ({
        mic: overrides.mic || prev.mic || stream.getAudioTracks()[0]?.getSettings?.().deviceId || '',
        cam: overrides.cam || prev.cam || stream.getVideoTracks()[0]?.getSettings?.().deviceId || '',
        speaker: prev.speaker || '',
      }));

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close?.();
      startMicMeter(stream);
    } catch (err) {
      setPermissionError('Camera/microphone access is required to take this interview. Please allow access and try again — check your browser\'s site settings if the prompt didn\'t appear.');
    }
  };

  const switchDevice = (kind, deviceId) => {
    setSelectedDevices((d) => ({ ...d, [kind]: deviceId }));
    if (kind === 'speaker') return; // output selection is display-only in most browsers
    enableDevices({ ...selectedDevices, [kind]: deviceId });
  };

  const playTestSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 440;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 500);
    } catch { /* ignore */ }
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

  const askPrompt = useCallback(
    async (promptText) => {
      setStage('asking');
      setLiveTranscript('');
      setManualAnswer('');
      await speak(promptText);
      startListening();
    },
    [startListening]
  );

  const startInterview = async () => {
    setStarting(true);
    try {
      const res = await api.post('/interviews/start', { jobId });
      const interview = res.data.interview;
      setInterviewId(interview._id);
      setTotalQuestions(interview.questions.length);
      setMainIndex(0);
      setPhase('main');
      setRoundsCompleted(0);
      setCurrentPrompt(interview.questions[0].question);
      askPrompt(interview.questions[0].question);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start interview', 'error');
    } finally {
      setStarting(false);
    }
  };

  const finishAnswering = async () => {
    recognitionRef.current?.stop();
    const spokenAnswer = (finalTranscriptRef.current || liveTranscript).trim();
    const finalAnswer = speechSupported ? spokenAnswer : manualAnswer.trim();

    if (!finalAnswer) {
      showToast('Please provide an answer before continuing', 'error');
      return;
    }

    setStage('submitting');
    try {
      const res = await api.put(`/interviews/${interviewId}/answer`, { answer: finalAnswer });
      const data = res.data;
      setRoundsCompleted((r) => r + 1);

      if (data.done) {
        setResult(data.interview);
        setStage('result');
        streamRef.current?.getTracks().forEach((t) => t.stop());
        return;
      }

      setPhase(data.phase);
      setCurrentPrompt(data.prompt);
      if (data.phase === 'main') {
        setMainIndex((i) => i + 1);
      }
      askPrompt(data.prompt);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit answer', 'error');
      setStage('listening');
    }
  };

  if (!job) return <p className="center-msg">Loading...</p>;

  const showBigPreview = stage === 'setup';
  const totalRounds = totalQuestions * 2;
  const progressPct = totalRounds > 0 ? (roundsCompleted / totalRounds) * 100 : 0;

  return (
    <div className="page ai-interview-page">
      <h1>AI Interview — {job.title}</h1>

      {(stage === 'setup' || stage === 'asking' || stage === 'listening' || stage === 'submitting') && (
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
                This is an adaptive spoken AI interview: after each question, the AI asks a
                follow-up based on what you actually said — to probe deeper and check consistency —
                before moving to the next question. Camera and microphone access is required to begin.
              </p>
              {!speechSupported && (
                <p className="status-msg error">
                  Your browser doesn't support voice transcription. Use Chrome or Edge for the spoken
                  experience — you'll still need to grant camera/mic access to proceed, and can type
                  your answers instead of speaking them.
                </p>
              )}
              {permissionError && <p className="status-msg error">{permissionError}</p>}

              {cameraReady && (
                <>
                  <div className="device-row">
                    <div className="device-col">
                      <label>Microphone</label>
                      <select value={selectedDevices.mic} onChange={(e) => switchDevice('mic', e.target.value)}>
                        {devices.mics.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || `Microphone ${i + 1}`}
                          </option>
                        ))}
                      </select>
                      <div className="mic-meter">
                        <div className="mic-meter-fill" style={{ width: `${micLevel}%` }} />
                      </div>
                      <span className="resume-hint" style={{ fontSize: '0.72rem' }}>Speak to test your mic</span>
                    </div>

                    <div className="device-col">
                      <label>Speakers</label>
                      <select value={selectedDevices.speaker} onChange={(e) => switchDevice('speaker', e.target.value)}>
                        {devices.speakers.length === 0 && <option value="">System default</option>}
                        {devices.speakers.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || `Speaker ${i + 1}`}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="device-test" onClick={playTestSound}>Play test sound</button>
                    </div>

                    <div className="device-col">
                      <label>Camera</label>
                      <select value={selectedDevices.cam} onChange={(e) => switchDevice('cam', e.target.value)}>
                        {devices.cams.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || `Camera ${i + 1}`}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="device-test" onClick={() => enableDevices(selectedDevices)}>Restart devices</button>
                    </div>
                  </div>

                  <div className="interview-info-list">
                    <div className="interview-info-item"><span>◷</span><span>Expect to spend around 10 minutes</span></div>
                    <div className="interview-info-item"><span>⟳</span><span>You can retake this interview if something goes wrong</span></div>
                    <div className="interview-info-item"><span>⛨</span><span>Your camera feed is shown only to you — nothing is recorded or uploaded</span></div>
                    <div className="interview-info-item"><span>▤</span><span>Answers are transcribed in your browser and scored at the end</span></div>
                  </div>
                </>
              )}

              <div className="interview-setup-actions">
                {!cameraReady ? (
                  <button className="btn primary" onClick={() => enableDevices()}>Enable camera & mic to continue</button>
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

          {(stage === 'asking' || stage === 'listening' || stage === 'submitting') && (
            <div className="interview-live-main">
              <div className="interview-progress-bar">
                <div className="interview-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="section-label">
                Question {mainIndex + 1} of {totalQuestions}
                {phase === 'followup' && ' — Follow-up'}
              </span>
              <AIAvatar mode={stage === 'asking' ? 'speaking' : 'listening'} />
              <p className="interview-question-text">
                {phase === 'followup' && <span className="followup-tag">Follow-up</span>}
                {currentPrompt}
              </p>

              {stage === 'submitting' ? (
                <p className="center-msg">Thinking of a follow-up...</p>
              ) : speechSupported ? (
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

              <button
                className="btn primary"
                onClick={finishAnswering}
                disabled={stage === 'asking' || stage === 'submitting'}
              >
                {stage === 'submitting' ? 'Processing...' : 'Finish Answer & Continue'}
              </button>
            </div>
          )}
        </div>
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
                  {q.followUpQuestion && (
                    <p className="breakdown-followup">
                      <em>Follow-up: {q.followUpQuestion}</em>
                    </p>
                  )}
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