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
        // Capture stream at 30fps (Facebook Compatible & Stable)
        const stream = canvas.captureStream(30);

        try {
            // Facebook/Social Media prefer H.264 MP4
            const mimeTypes = [
                'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', // Explicit H.264 Baseline
                'video/mp4', // Generic MP4
                'video/webm; codecs=vp9', // High Quality WebM
                'video/webm' // Generic WebM
            ];

            let selectedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
            console.log("Recording with mimeType:", selectedType);

            // High Bitrate: 8 Mbps for crispy 1080p/60
            const options = {
                mimeType: selectedType,
                videoBitsPerSecond: 8000000
            };

            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => saveVideo(selectedType);
            recorder.start();
            setRecording(true);
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

    const saveVideo = (mimeType: string) => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Extension based on mimeType
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `fractal-recording-${Date.now()}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
    };

    return null; // This component handles side effects only
};
