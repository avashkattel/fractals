import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useFractalStore } from '../store/fractalStore';

export const Recorder = () => {
    const { isRecording, setRecording } = useFractalStore();
    const { gl } = useThree();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    }, [isRecording]);

    const startRecording = () => {
        const canvas = gl.domElement;
        // Capture stream at 60fps (or whatever the browser supports)
        const stream = canvas.captureStream(60);

        try {
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = saveVideo;
            recorder.start();
            console.log("Recording started");
        } catch (err) {
            console.error("Failed to start recording:", err);
            setRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            console.log("Recording stopped");
        }
    };

    const saveVideo = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fractal-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return null; // This component handles side effects only
};
